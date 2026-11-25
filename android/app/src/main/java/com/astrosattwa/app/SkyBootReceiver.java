package com.astrosattwa.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Reinício do aparelho, atualização do app ou mudança de relógio/fuso:
 * os alarmes são perdidos, então reexibe o retrato vigente e reagenda.
 */
public class SkyBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SkyScheduler.update(context);
        SkyEventScheduler.update(context);
    }
}
