package {{PACKAGE_NAME}}

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.RelativeLayout
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private val webUrl = "{{WEB_URL}}"
    private val splashColor = "{{SPLASH_COLOR}}"
    private val themeColor = "{{THEME_COLOR}}"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = RelativeLayout(this)
        try {
            layout.setBackgroundColor(Color.parseColor(splashColor))
        } catch (e: IllegalArgumentException) {
            layout.setBackgroundColor(Color.WHITE)
        }

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        progressBar.id = View.generateViewId()
        progressBar.isIndeterminate = false
        progressBar.max = 100
        val pbParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            8
        )
        pbParams.addRule(RelativeLayout.ALIGN_PARENT_TOP)
        try {
            progressBar.progressTintList = android.content.res.ColorStateList.valueOf(Color.parseColor(themeColor))
        } catch (e: IllegalArgumentException) {
            progressBar.progressTintList = android.content.res.ColorStateList.valueOf(Color.parseColor("#0891b2"))
        }
        layout.addView(progressBar, pbParams)

        webView = WebView(this)
        val wvParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        )
        wvParams.addRule(RelativeLayout.BELOW, progressBar.id)
        layout.addView(webView, wvParams)

        setContentView(layout)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            userAgentString = userAgentString + " LumynWrapp/1.0"
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress < 100) View.VISIBLE else View.GONE
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return if (url.startsWith("http") || url.startsWith("https")) {
                    view?.loadUrl(url)
                    false
                } else {
                    true
                }
            }
        }

        webView.loadUrl(webUrl)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
