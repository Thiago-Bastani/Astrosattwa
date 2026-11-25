package com.astrosattwa.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Notificações das mudanças do céu (signo, decanato, fase da Lua, nakshatra, manzil),
 * calculadas no app (JS) para as próximas 48h.
 *
 * Sem duplicidade: um único alarme (sempre substituído), uma marca d'água com o
 * instante do último aviso (só avisa eventos depois dela) e id de notificação
 * derivado da chave do evento (se repetir, substitui em vez de somar).
 */
public final class SkyEventScheduler {

    static final String CHANNEL_ID = "sky_events";
    private static final String PREFS = "sky_events";
    private static final String KEY_EVENTS = "events";
    private static final String KEY_WATERMARK = "notifiedUntil";
    /** Aparelho desligado/sem alarme: não despeja avisos mais velhos que isto. */
    private static final long MAX_LATE_MS = 60 * 60 * 1000L;
    private static final int REQUEST_CODE = 1;

    private SkyEventScheduler() {}

    static void saveEvents(Context ctx, JSONArray events) {
        SharedPreferences p = prefs(ctx);
        SharedPreferences.Editor e = p.edit().putString(KEY_EVENTS, events.toString());
        // Primeira vez: não avisa nada que já passou
        if (!p.contains(KEY_WATERMARK)) e.putLong(KEY_WATERMARK, System.currentTimeMillis());
        e.apply();
    }

    /** Avisa os eventos vencidos ainda não avisados e agenda o próximo. */
    static void update(Context ctx) {
        SharedPreferences p = prefs(ctx);
        JSONArray list = load(p);
        long now = System.currentTimeMillis();
        long watermark = p.getLong(KEY_WATERMARK, now);

        long next = -1;
        for (int i = 0; i < list.length(); i++) {
            JSONObject ev = list.optJSONObject(i);
            if (ev == null) continue;
            long at = ev.optLong("at");
            if (at > now) {
                if (next < 0 || at < next) next = at;
            } else if (at > watermark && now - at <= MAX_LATE_MS) {
                show(ctx, ev);
            }
        }
        if (now > watermark) p.edit().putLong(KEY_WATERMARK, now).apply();

        if (next > 0) armAlarm(ctx, next);
        else cancelAlarm(ctx);
    }

    private static void show(Context ctx, JSONObject ev) {
        if (Build.VERSION.SDK_INT >= 33
                && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                   != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        ensureChannel(ctx);

        Intent open = new Intent(ctx, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(
                ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String text = ev.optString("text");
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_sky)
                .setContentTitle(ev.optString("title"))
                .setContentText(text)
                .setSubText("védico · sideral")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                .setWhen(ev.optLong("at"))
                .setShowWhen(true)
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_EVENT)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(content);

        try {
            int id = 0x5E000000 ^ ev.optString("key").hashCode();
            NotificationManagerCompat.from(ctx).notify(id, b.build());
        } catch (SecurityException ignored) {
            // permissão revogada entre a checagem e o envio
        }
    }

    private static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Mudanças do céu", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Planeta muda de signo ou decanato, fase da Lua, nakshatra e manzil (védico)");
        nm.createNotificationChannel(ch);
    }

    private static PendingIntent alarmIntent(Context ctx) {
        Intent i = new Intent(ctx, SkyEventReceiver.class);
        return PendingIntent.getBroadcast(
                ctx, REQUEST_CODE, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void armAlarm(Context ctx, long at) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = alarmIntent(ctx);
        try {
            boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
            if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private static void cancelAlarm(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(alarmIntent(ctx));
    }

    private static JSONArray load(SharedPreferences p) {
        try {
            return new JSONArray(p.getString(KEY_EVENTS, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
