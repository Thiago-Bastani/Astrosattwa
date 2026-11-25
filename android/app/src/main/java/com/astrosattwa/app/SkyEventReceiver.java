package com.astrosattwa.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarme de mudança do céu: avisa o evento e agenda o próximo. */
public class SkyEventReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SkyEventScheduler.update(context);
    }
}
