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
 * Exibe a notificação fixa "Céu agora" a partir de uma lista de retratos
 * pré-calculados pelo app (JS) e agenda o alarme da próxima troca de texto.
 * Não faz cálculo astrológico: só mostra o retrato vigente.
 */
public final class SkyScheduler {

    static final String CHANNEL_ID = "sky_now";
    static final int NOTIFICATION_ID = 4201;
    private static final String PREFS = "sky_notification";
    private static final String KEY_SNAPSHOTS = "snapshots";
    /** Depois do último retrato, a notificação ainda vale por este tempo. */
    private static final long STALE_AFTER_MS = 30 * 60 * 1000L;

    private SkyScheduler() {}

    static void saveSnapshots(Context ctx, JSONArray snapshots) {
        prefs(ctx).edit().putString(KEY_SNAPSHOTS, snapshots.toString()).apply();
    }

    static void clear(Context ctx) {
        prefs(ctx).edit().remove(KEY_SNAPSHOTS).apply();
        cancelAlarm(ctx);
        NotificationManagerCompat.from(ctx).cancel(NOTIFICATION_ID);
    }

    /** Mostra o retrato vigente e agenda o próximo. Chamado pelo plugin, alarme e boot. */
    static void update(Context ctx) {
        JSONArray list = load(ctx);
        long now = System.currentTimeMillis();

        JSONObject current = null;
        JSONObject next = null;
        for (int i = 0; i < list.length(); i++) {
            JSONObject s = list.optJSONObject(i);
            if (s == null) continue;
            long at = s.optLong("at");
            if (at <= now) current = s;
            else { next = s; break; }
        }

        if (current != null && (next != null || now - current.optLong("at") < STALE_AFTER_MS)) {
            show(ctx, current);
        } else if (current == null && next == null) {
            NotificationManagerCompat.from(ctx).cancel(NOTIFICATION_ID);
        } else if (next == null) {
            // Retratos acabaram (app não aberto há 48h): remove para não mostrar dado velho
            NotificationManagerCompat.from(ctx).cancel(NOTIFICATION_ID);
        }

        if (next != null) armAlarm(ctx, next.optLong("at"));
        else cancelAlarm(ctx);
    }

    private static void show(Context ctx, JSONObject s) {
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

        String body = s.optString("body");
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_sky)
                .setContentTitle(s.optString("title"))
                .setContentText(body)
                .setSubText(s.optString("sub"))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setShowWhen(false)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(content);

        try {
            NotificationManagerCompat.from(ctx).notify(NOTIFICATION_ID, b.build());
        } catch (SecurityException ignored) {
            // permissão revogada entre a checagem e o envio
        }
    }

    private static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Céu agora", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("Hora planetária, Ascendente e posição do regente da hora");
        ch.setShowBadge(false);
        ch.setSound(null, null);
        ch.enableVibration(false);
        nm.createNotificationChannel(ch);
    }

    private static PendingIntent alarmIntent(Context ctx) {
        Intent i = new Intent(ctx, SkyAlarmReceiver.class);
        return PendingIntent.getBroadcast(
                ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
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

    private static JSONArray load(Context ctx) {
        try {
            return new JSONArray(prefs(ctx).getString(KEY_SNAPSHOTS, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
