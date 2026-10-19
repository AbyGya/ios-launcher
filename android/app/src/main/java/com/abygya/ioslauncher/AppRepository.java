package com.abygya.ioslauncher;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.provider.Settings;
import android.util.Base64;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class AppRepository {
  private final Context ctx;
  private final PackageManager pm;
  private final HashMap<String, String> iconMem = new HashMap<>();
  private List<AppEntry> cachedApps;

  static class AppEntry {
    String pkg;
    String label;
    boolean system;
  }

  AppRepository(Context context) {
    ctx = context.getApplicationContext();
    pm = ctx.getPackageManager();
  }

  synchronized void invalidate() {
    cachedApps = null;
  }

  synchronized List<AppEntry> apps() {
    if (cachedApps != null) return cachedApps;
    Intent main = new Intent(Intent.ACTION_MAIN, null);
    main.addCategory(Intent.CATEGORY_LAUNCHER);
    List<ResolveInfo> resolved = pm.queryIntentActivities(main, 0);
    HashMap<String, AppEntry> byPkg = new HashMap<>();
    for (ResolveInfo ri : resolved) {
      ActivityInfo ai = ri.activityInfo;
      if (ai == null) continue;
      String pkg = ai.packageName;
      if (ctx.getPackageName().equals(pkg)) continue;
      if (byPkg.containsKey(pkg)) continue;
      AppEntry e = new AppEntry();
      e.pkg = pkg;
      CharSequence label = ai.loadLabel(pm);
      e.label = label != null ? label.toString() : pkg;
      try {
        e.system = (pm.getApplicationInfo(pkg, 0).flags & ApplicationInfo.FLAG_SYSTEM) != 0;
      } catch (Exception ex) {
        e.system = false;
      }
      byPkg.put(pkg, e);
    }
    cachedApps = new ArrayList<>(byPkg.values());
    return cachedApps;
  }

  String appsJson() {
    JSONArray arr = new JSONArray();
    for (AppEntry e : apps()) {
      JSONObject o = new JSONObject();
      try {
        o.put("id", e.pkg);
        o.put("pkg", e.pkg);
        o.put("label", e.label);
        o.put("system", e.system);
      } catch (Exception ignored) {
      }
      arr.put(o);
    }
    return arr.toString();
  }

  synchronized String icon(String pkg) {
    String hit = iconMem.get(pkg);
    if (hit != null) return hit;
    File dir = new File(ctx.getFilesDir(), "appicons");
    if (!dir.exists()) dir.mkdirs();
    File f = new File(dir, safeName(pkg) + ".png");
    byte[] bytes = f.exists() ? readFile(f) : null;
    if (bytes == null) {
      try {
        Drawable d = pm.getApplicationIcon(pkg);
        Bitmap bmp = Bitmap.createBitmap(192, 192, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        d.setBounds(0, 0, 192, 192);
        d.draw(canvas);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, bos);
        bmp.recycle();
        bytes = bos.toByteArray();
        writeFile(f, bytes);
      } catch (Exception ex) {
        return "";
      }
    }
    String url = "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);
    iconMem.put(pkg, url);
    return url;
  }

  boolean launch(String pkg) {
    try {
      Intent i = pm.getLaunchIntentForPackage(pkg);
      if (i == null) return false;
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
      ctx.startActivity(i);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  String statusJson() {
    JSONObject o = new JSONObject();
    try {
      o.put("time", System.currentTimeMillis());
      Intent battery = ctx.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
      int level = 0;
      int scale = 100;
      int status = 0;
      if (battery != null) {
        level = battery.getIntExtra(BatteryManager.EXTRA_LEVEL, 0);
        scale = battery.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
        status = battery.getIntExtra(BatteryManager.EXTRA_STATUS, 0);
      }
      o.put("battery", scale > 0 ? Math.round(level * 100f / scale) : level);
      o.put(
        "charging",
        status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
      );
      boolean wifi = false;
      boolean cell = false;
      ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
      if (cm != null) {
        Network n = cm.getActiveNetwork();
        NetworkCapabilities caps = n != null ? cm.getNetworkCapabilities(n) : null;
        if (caps != null) {
          wifi = caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
          cell = caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR);
        }
      }
      o.put("wifi", wifi);
      o.put("cellular", cell);
      o.put(
        "airplane",
        Settings.Global.getInt(ctx.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) == 1
      );
    } catch (Exception ignored) {
    }
    return o.toString();
  }

  boolean isDefaultLauncher() {
    try {
      Intent home = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
      ResolveInfo r = pm.resolveActivity(home, PackageManager.MATCH_DEFAULT_ONLY);
      return r != null && ctx.getPackageName().equals(r.activityInfo.packageName);
    } catch (Exception e) {
      return false;
    }
  }

  String versionName() {
    try {
      String v = pm.getPackageInfo(ctx.getPackageName(), 0).versionName;
      return v != null ? v : "";
    } catch (Exception e) {
      return "";
    }
  }

  private static String safeName(String pkg) {
    return pkg.replaceAll("[^a-zA-Z0-9._-]", "_");
  }

  private static byte[] readFile(File f) {
    try (FileInputStream in = new FileInputStream(f)) {
      ByteArrayOutputStream bos = new ByteArrayOutputStream();
      byte[] buf = new byte[8192];
      int n;
      while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
      return bos.toByteArray();
    } catch (Exception e) {
      return null;
    }
  }

  private static void writeFile(File f, byte[] data) {
    try (FileOutputStream out = new FileOutputStream(f)) {
      out.write(data);
    } catch (Exception ignored) {
    }
  }
}
