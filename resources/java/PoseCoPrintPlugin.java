package dz.poseco.terrain;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Impression d'une page HTML avec la fenêtre d'impression d'Android
 * (imprimante réseau/Wi-Fi, ou "Enregistrer au format PDF").
 */
@CapacitorPlugin(name = "PoseCoPrint")
public class PoseCoPrintPlugin extends Plugin {

    // Référence conservée : sans elle, le WebView peut être détruit avant la fin de l'impression.
    private WebView printView;
    private boolean fired;

    @PluginMethod
    public void print(final PluginCall call) {
        final String html = call.getString("html", "");
        final String name = call.getString("name", "Pose CO");
        final boolean landscape = Boolean.TRUE.equals(call.getBoolean("landscape", false));
        if (html == null || html.isEmpty()) {
            call.reject("Aucun contenu à imprimer");
            return;
        }
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    fired = false;
                    final WebView wv = new WebView(getActivity());
                    printView = wv;
                    wv.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            if (fired) {
                                return;
                            }
                            fired = true;
                            try {
                                PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                                PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(name);
                                PrintAttributes.MediaSize size = landscape
                                        ? PrintAttributes.MediaSize.ISO_A4.asLandscape()
                                        : PrintAttributes.MediaSize.ISO_A4;
                                PrintAttributes attrs = new PrintAttributes.Builder()
                                        .setMediaSize(size)
                                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                        .build();
                                pm.print(name, adapter, attrs);
                                call.resolve();
                            } catch (Exception e) {
                                call.reject("Impression impossible : " + e.getMessage());
                            }
                        }
                    });
                    wv.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    call.reject("Impression impossible : " + e.getMessage());
                }
            }
        });
    }
}
