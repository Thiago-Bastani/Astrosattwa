package com.astrosattwa.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarme agendado: troca o texto da notificação e agenda a próxima troca. */
public class SkyAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SkyScheduler.update(context);
    }
}
