package shop.ggnch.twa;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        // 시스템이 다크 테마일 때 안드로이드가 우리 페이지를 강제로 다시 어둡게
        // 보정하던 문제. 사이트가 color-scheme 메타로 이미 자체 라이트/다크를
        // 관리하므로, 안드로이드의 강제 보정을 완전히 꺼서 충돌을 없앤다.
        // FORCE_DARK는 Android 13(API 33)부터 사실상 동작하지 않는 옛 API라
        // ALGORITHMIC_DARKENING(신형 API)도 같이 꺼야 최신 기기에서 실제로 먹힌다.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            WebSettingsCompat.setForceDark(webView.getSettings(), WebSettingsCompat.FORCE_DARK_OFF);
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.getSettings(), false);
        }

        // 기기의 시스템 글자 크기 설정과 무관하게 웹뷰 폰트 배율을 100%로 고정
        // (일부 폴더블 기기에서 전체 UI가 과도하게 커 보이던 문제 대응).
        webView.getSettings().setTextZoom(100);

        // 카톡 공유 등이 여는 intent:// 주소를 Capacitor 기본 처리(ACTION_VIEW)는 못 열고
        // 조용히 무시한다. intent:// 는 안드로이드 인텐트로 풀어서 해당 앱(카카오톡)을 열고,
        // 앱이 없으면 fallback 주소나 Play 스토어로 보낸다. 그 외 주소는 기존 처리 그대로.
        getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("intent:")) {
                    openIntentUrl(url);
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }

    private void openIntentUrl(String url) {
        Intent intent;
        try {
            intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
        } catch (Exception e) {
            return;
        }
        // 인텐트 주소로 우리 앱 내부 컴포넌트를 임의로 열지 못하게 막는다.
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.setComponent(null);
        intent.setSelector(null);
        try {
            startActivity(intent);
            return;
        } catch (ActivityNotFoundException ignored) {
        }

        String fallback = intent.getStringExtra("browser_fallback_url");
        if (fallback != null) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(fallback)));
                return;
            } catch (ActivityNotFoundException ignored) {
            }
        }
        String pkg = intent.getPackage();
        if (pkg != null) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg)));
            } catch (ActivityNotFoundException ignored) {
            }
        }
    }
}
