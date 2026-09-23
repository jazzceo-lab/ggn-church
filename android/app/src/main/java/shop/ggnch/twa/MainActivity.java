package shop.ggnch.twa;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        // 시스템이 다크 테마일 때 안드로이드가 우리 페이지를 강제로 다시 어둡게
        // 보정하던 문제. 사이트가 color-scheme 메타로 이미 자체 라이트/다크를
        // 관리하므로, 안드로이드의 강제 보정을 완전히 꺼서 충돌을 없앤다.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            WebSettingsCompat.setForceDark(webView.getSettings(), WebSettingsCompat.FORCE_DARK_OFF);
        }

        // 기기의 시스템 글자 크기 설정과 무관하게 웹뷰 폰트 배율을 100%로 고정
        // (일부 폴더블 기기에서 전체 UI가 과도하게 커 보이던 문제 대응).
        webView.getSettings().setTextZoom(100);
    }
}
