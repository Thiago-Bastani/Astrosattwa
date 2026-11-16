package com.astrosattwa.app;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import androidx.core.app.NotificationManagerCompat;

/** Ponte JS ↔ SkyScheduler: recebe os retratos calculados no app e controla a notificação. */
@CapacitorPlugin(
    name = "SkyNotification",
    permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
    }
)
public class SkyNotificationPlugin extends Plugin {

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33) {
            resolveGranted(call, NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
            return;
        }
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            resolveGranted(call, true);
        } else {
            requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
        }
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        resolveGranted(call, getPermissionState("notifications") == PermissionState.GRANTED);
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray snapshots = call.getArray("snapshots");
        if (snapshots == null) {
            call.reject("snapshots ausente");
            return;
        }
        SkyScheduler.saveSnapshots(getContext(), snapshots);
        SkyScheduler.update(getContext());
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        SkyScheduler.clear(getContext());
        call.resolve();
    }

    private static void resolveGranted(PluginCall call, boolean granted) {
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }
}
