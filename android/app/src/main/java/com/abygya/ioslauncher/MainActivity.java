package com.abygya.ioslauncher;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.view.DisplayCutout;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;

public class MainActivity extends Activity {
  private static final String TAG = "ioslauncher";
  private static final String BASE_URL = "https://appassets.local/";

  private final StringBuilder bootLog = new StringBuilder();
  private FrameLayout root;
  private WebView web;
  private JsBridge bridge;
  private int renderGoneCount;

  private final BroadcastReceiver batteryReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      pushStatus();
    }
  };

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    installCrashLogger();
    try {
      boot();
    } catch (Throwable t) {
      showFatal(t);
    }
  }

  private void boot() {
    note("boot start");
    root = new FrameLayout(this);
    root.setBackgroundColor(Color.BLACK);
    setContentView(root);
    applyImmersive();
    note("immersive ok");
    buildWeb();
    note("webview ready");
    try {
      registerReceiver(batteryReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
      note("battery receiver ok");
    } catch (Throwable t) {
      note("battery receiver failed: " + t);
    }
    if (Build.VERSION.SDK_INT >= 33) {
      try {
        getOnBackInvokedDispatcher()
          .registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, () -> {});
      } catch (Throwable t) {
        note("back callback failed: " + t);
      }
    }
    note("boot done v" + getPackageName());
  }

  private void buildWeb() {
    web = new WebView(this);
    web.setLayoutParams(
      new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    );
    web.setBackgroundColor(Color.BLACK);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    web.setLongClickable(false);
    web.setHapticFeedbackEnabled(false);

    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setAllowFileAccess(false);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setSupportZoom(false);
    s.setBuiltInZoomControls(false);
    s.setTextZoom(100);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);

    web.setWebViewClient(
      new WebViewClient() {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
          Uri u = request.getUrl();
          if (u != null && "appassets.local".equals(u.getHost())) {
            return assetResponse(u.getPath());
          }
          return null;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
          String url = request.getUrl().toString();
          if (url.startsWith(BASE_URL)) return false;
          try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
          } catch (Exception ignored) {
          }
          return true;
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
          note("renderer gone count=" + renderGoneCount);
          renderGoneCount++;
          try {
            root.removeView(view);
            view.destroy();
          } catch (Throwable ignored) {
          }
          web = null;
          if (renderGoneCount > 2) {
            showFatal(new RuntimeException("WebView renderer crashed repeatedly"));
            return true;
          }
          try {
            buildWeb();
          } catch (Throwable t) {
            showFatal(t);
          }
          return true;
        }
      }
    );

    bridge = new JsBridge(this);
    web.addJavascriptInterface(bridge, "NativeBridge");
    root.addView(web);
    web.loadUrl(BASE_URL + "index.html");
    web.postDelayed(() -> {
      if (web == null) return;
      try {
        web.evaluateJavascript(
          "(function(){var r=document.getElementById('root');return r&&r.children.length>0?'ok':'empty';})()",
          value -> {
            note("render check: " + value);
            if (value != null && value.contains("empty")) {
              showFatal(new RuntimeException("UI tidak muncul (root kosong)"));
            }
          }
        );
      } catch (Throwable ignored) {
      }
    }, 6000);
  }

  private WebResourceResponse assetResponse(String path) {
    if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
    HashMap<String, String> headers = new HashMap<>();
    headers.put("Cache-Control", "no-store");
    try {
      InputStream in = getAssets().open("web" + path);
      String mime = mimeFor(path);
      return new WebResourceResponse(mime, charsetFor(mime), 200, "OK", headers, in);
    } catch (Throwable t) {
      note("asset 404: " + path);
      return new WebResourceResponse(
        "text/plain", "utf-8", 404, "Not Found", headers, new ByteArrayInputStream(new byte[0])
      );
    }
  }

  private static String mimeFor(String path) {
    String p = path.toLowerCase(Locale.US);
    int q = p.indexOf('?');
    if (q >= 0) p = p.substring(0, q);
    if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
    if (p.endsWith(".js") || p.endsWith(".mjs")) return "application/javascript";
    if (p.endsWith(".css")) return "text/css";
    if (p.endsWith(".json") || p.endsWith(".map")) return "application/json";
    if (p.endsWith(".svg")) return "image/svg+xml";
    if (p.endsWith(".png")) return "image/png";
    if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
    if (p.endsWith(".webp")) return "image/webp";
    if (p.endsWith(".ico")) return "image/x-icon";
    if (p.endsWith(".woff2")) return "font/woff2";
    if (p.endsWith(".woff")) return "font/woff";
    if (p.endsWith(".ttf")) return "font/ttf";
    if (p.endsWith(".otf")) return "font/otf";
    if (p.endsWith(".txt")) return "text/plain";
    if (p.endsWith(".wasm")) return "application/wasm";
    return "application/octet-stream";
  }

  private static String charsetFor(String mime) {
    if (
      mime.startsWith("text/") ||
      mime.equals("application/javascript") ||
      mime.equals("application/json") ||
      mime.equals("image/svg+xml")
    ) return "utf-8";
    return null;
  }

  @Override
  protected void onResume() {
    super.onResume();
    pushStatus();
    eval("window.dispatchEvent(new Event('native-resume'))");
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    pushStatus();
    eval("window.dispatchEvent(new Event('native-resume'))");
  }

  @Override
  @SuppressWarnings("deprecation")
  public void onBackPressed() {
  }

  @Override
  protected void onDestroy() {
    try {
      unregisterReceiver(batteryReceiver);
    } catch (Throwable ignored) {
    }
    super.onDestroy();
  }

  void pushStatus() {
    if (bridge == null) return;
    try {
      String json = bridge.statusJson();
      eval("window.__nativeStatus&&window.__nativeStatus(" + JSONObject.quote(json) + ")");
    } catch (Throwable ignored) {
    }
  }

  String insetsJson() {
    JSONObject o = new JSONObject();
    try {
      int top = 0;
      int bottom = 0;
      WindowInsets wi = getWindow().getDecorView().getRootWindowInsets();
      if (wi != null) {
        if (Build.VERSION.SDK_INT >= 28) {
          DisplayCutout cut = wi.getDisplayCutout();
          if (cut != null) top = cut.getSafeInsetTop();
        }
        if (Build.VERSION.SDK_INT >= 30) {
          top = Math.max(top, wi.getInsets(WindowInsets.Type.systemBars()).top);
          bottom = wi.getInsets(WindowInsets.Type.systemBars()).bottom;
        }
      }
      o.put("top", top);
      o.put("bottom", bottom);
      o.put("scale", (double) getResources().getDisplayMetrics().density);
      o.put("width", getResources().getDisplayMetrics().widthPixels);
      o.put("height", getResources().getDisplayMetrics().heightPixels);
    } catch (Exception ignored) {
    }
    return o.toString();
  }

  private void eval(String js) {
    if (web == null) return;
    try {
      web.evaluateJavascript(js, null);
    } catch (Throwable ignored) {
    }
  }

  private void note(String line) {
    bootLog.append(new Date()).append("  ").append(line).append('\n');
    Log.d(TAG, "boot: " + line);
  }

  private void showFatal(Throwable t) {
    note("FATAL: " + t);
    writeCrash(t);
    try {
      ScrollView sv = new ScrollView(this);
      TextView tv = new TextView(this);
      tv.setText(
        "iOS Launcher gagal start.\nScreenshot layar ini dan kirim ke developer:\n\n" +
        bootLog +
        "\n" +
        Log.getStackTraceString(t)
      );
      tv.setTextSize(10f);
      tv.setTextColor(0xFFFF8080);
      tv.setBackgroundColor(Color.BLACK);
      tv.setTextIsSelectable(true);
      tv.setPadding(48, 120, 48, 48);
      sv.addView(tv);
      setContentView(sv);
    } catch (Throwable ignored) {
    }
  }

  private void installCrashLogger() {
    final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
    Thread.setDefaultUncaughtExceptionHandler((thread, e) -> {
      writeCrash(e);
      if (prev != null) prev.uncaughtException(thread, e);
    });
  }

  private void writeCrash(Throwable e) {
    String data = new Date() + "\n" + bootLog + "\n" + Log.getStackTraceString(e) + "\n";
    writeText("crash.txt", data);
    if (Build.VERSION.SDK_INT >= 29) {
      try {
        ContentValues v = new ContentValues();
        v.put(MediaStore.MediaColumns.DISPLAY_NAME, "ios-launcher-crash.txt");
        v.put(MediaStore.MediaColumns.MIME_TYPE, "text/plain");
        v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
        if (uri != null) {
          OutputStream os = getContentResolver().openOutputStream(uri);
          if (os != null) {
            os.write(data.getBytes());
            os.close();
          }
        }
      } catch (Throwable ignored) {
      }
    }
  }

  private void writeText(String name, String data) {
    try {
      File dir = getExternalFilesDir("logs");
      if (dir == null) return;
      dir.mkdirs();
      FileOutputStream out = new FileOutputStream(new File(dir, name));
      out.write(data.getBytes());
      out.close();
    } catch (Throwable ignored) {
    }
  }

  private void applyImmersive() {
    try {
      View decor = getWindow().getDecorView();
      if (decor == null) return;
      if (Build.VERSION.SDK_INT >= 30) {
        getWindow().setDecorFitsSystemWindows(false);
        WindowInsetsController c = decor.getWindowInsetsController();
        if (c != null) {
          c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
          c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
      } else {
        decor.setSystemUiVisibility(
          View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
          View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
          View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
          View.SYSTEM_UI_FLAG_FULLSCREEN |
          View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
          View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
      }
      getWindow().setStatusBarColor(Color.TRANSPARENT);
      getWindow().setNavigationBarColor(Color.BLACK);
    } catch (Throwable t) {
      note("immersive failed: " + t);
    }
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) applyImmersive();
  }
}
