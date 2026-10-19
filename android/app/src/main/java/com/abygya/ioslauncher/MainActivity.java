package com.abygya.ioslauncher;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.DisplayCutout;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import org.json.JSONObject;

public class MainActivity extends Activity {
  private WebView web;
  private JsBridge bridge;

  private final BroadcastReceiver batteryReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      pushStatus();
    }
  };

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    applyImmersive();

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
    s.setAllowFileAccess(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setSupportZoom(false);
    s.setBuiltInZoomControls(false);
    s.setTextZoom(100);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);

    web.setWebViewClient(
      new WebViewClient() {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
          String url = request.getUrl().toString();
          if (url.startsWith("file://")) return false;
          try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
          } catch (Exception ignored) {
          }
          return true;
        }
      }
    );

    bridge = new JsBridge(this);
    web.addJavascriptInterface(bridge, "NativeBridge");

    setContentView(web);
    web.loadUrl("file:///android_asset/web/index.html");

    registerReceiver(batteryReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));

    if (Build.VERSION.SDK_INT >= 33) {
      getOnBackInvokedDispatcher()
        .registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, () -> {});
    }
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
    } catch (Exception ignored) {
    }
    super.onDestroy();
  }

  void pushStatus() {
    if (bridge == null) return;
    String json = bridge.statusJson();
    eval("window.__nativeStatus&&window.__nativeStatus(" + JSONObject.quote(json) + ")");
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
          top = Math.max(top, wi.getInsets(WindowInsets.Type.systemBars()).top);
        }
        bottom = wi.getInsets(WindowInsets.Type.systemBars()).bottom;
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
    } catch (Exception ignored) {
    }
  }

  private void applyImmersive() {
    if (Build.VERSION.SDK_INT >= 30) {
      getWindow().setDecorFitsSystemWindows(false);
      WindowInsetsController c = getWindow().getInsetsController();
      if (c != null) {
        c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
        c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
      }
    } else {
      getWindow().getDecorView().setSystemUiVisibility(
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
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) applyImmersive();
  }
}
