package com.abygya.ioslauncher;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.provider.Settings;
import android.webkit.JavascriptInterface;

public class JsBridge {
  private final MainActivity activity;
  private final AppRepository repo;

  JsBridge(MainActivity activity) {
    this.activity = activity;
    this.repo = new AppRepository(activity);
  }

  @JavascriptInterface
  public String getApps() {
    return repo.appsJson();
  }

  @JavascriptInterface
  public String getIcon(String pkg) {
    return repo.icon(pkg);
  }

  @JavascriptInterface
  public boolean launch(String pkg) {
    return repo.launch(pkg);
  }

  @JavascriptInterface
  public String getStatus() {
    return repo.statusJson();
  }

  @JavascriptInterface
  public String getInsets() {
    return activity.insetsJson();
  }

  @JavascriptInterface
  public boolean isDefault() {
    return repo.isDefaultLauncher();
  }

  @JavascriptInterface
  public String version() {
    return repo.versionName();
  }

  @JavascriptInterface
  public void openHomeSettings() {
    try {
      activity.startActivity(new Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    } catch (Exception ignored) {
    }
  }

  @JavascriptInterface
  public void openAppInfo(String pkg) {
    try {
      activity.startActivity(
        new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      );
    } catch (Exception ignored) {
    }
  }

  @JavascriptInterface
  public void uninstall(String pkg) {
    try {
      activity.startActivity(
        new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + pkg))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      );
    } catch (Exception ignored) {
    }
  }

  @JavascriptInterface
  public void openUrl(String url) {
    try {
      activity.startActivity(
        new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      );
    } catch (Exception ignored) {
    }
  }

  @JavascriptInterface
  public void vibrate(int ms) {
    try {
      Vibrator v;
      if (Build.VERSION.SDK_INT >= 31) {
        VibratorManager vm = (VibratorManager) activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
        v = vm != null ? vm.getDefaultVibrator() : null;
      } else {
        v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
      }
      if (v == null || !v.hasVibrator()) return;
      v.vibrate(VibrationEffect.createOneShot(Math.max(1, ms), VibrationEffect.DEFAULT_AMPLITUDE));
    } catch (Exception ignored) {
    }
  }

  @JavascriptInterface
  public void refreshApps() {
    repo.invalidate();
  }

  String statusJson() {
    return repo.statusJson();
  }
}
