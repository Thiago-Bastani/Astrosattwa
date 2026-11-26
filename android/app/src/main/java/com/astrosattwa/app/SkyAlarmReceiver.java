package com.astrosattwa.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Alarme agendado: troca o texto da notificação e agenda a próxima troca.
 * Aproveita o despertar para conferir os avisos de mudança do céu (rede de segurança
 * caso o alarme próprio deles tenha sido adiado pelo sistema).
 */
public class SkyAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SkyScheduler.update(context);
        SkyEventScheduler.update(context);
    }
}
