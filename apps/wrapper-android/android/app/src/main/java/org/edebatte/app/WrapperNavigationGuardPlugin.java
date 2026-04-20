package org.edebatte.app;

import android.net.Uri;
import androidx.annotation.NonNull;
import com.getcapacitor.Bridge;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(name = "WrapperNavigationGuard")
public class WrapperNavigationGuardPlugin extends Plugin {

    private enum PathBucket {
        MVP,
        LATER,
        EXCLUDED,
        UNKNOWN,
        INVALID,
    }

    private static final Set<String> EXACT_MVP_PATHS = new HashSet<>(
        Arrays.asList(
            "/",
            "/start",
            "/login",
            "/logout",
            "/account",
            "/account/payment",
            "/account/security",
            "/create",
            "/swipes",
            "/runden",
            "/anlassraum",
            "/pricing",
            "/vormerken",
            "/impressum",
            "/datenschutz",
            "/agb",
            "/widerrufsbelehrung",
            "/barrierefreiheit",
            "/stream",
            "/sw",
            "/swipe"
        )
    );

    private static final String[] PREFIX_MVP_PATHS = { "/swipes/", "/round/", "/dossier/", "/stream/" };
    private static final Set<String> EXACT_LATER_PATHS = new HashSet<>(Arrays.asList("/atlas", "/atlas/weekly", "/community"));
    private static final String[] PREFIX_LATER_PATHS = { "/companion/", "/report/" };
    private static final Set<String> EXACT_EXCLUDED_PATHS = new HashSet<>(Arrays.asList("/studio", "/atlas/social-review"));
    private static final String[] PREFIX_EXCLUDED_PATHS = {
        "/admin/",
        "/dashboard/",
        "/demo/",
        "/embed/",
        "/research/",
        "/overlay/",
    };

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null) {
            return true;
        }

        String scheme = lower(url.getScheme());
        if (!"http".equals(scheme) && !"https".equals(scheme)) {
            return null;
        }

        Bridge bridge = getBridge();
        Uri appUri = Uri.parse(bridge.getAppUrl());
        if (!isSameOrigin(appUri, url)) {
            return null;
        }

        PathBucket bucket = classifyPath(url.getPath());
        if (bucket == PathBucket.MVP) {
            return false;
        }

        String fallbackUrl = buildFallbackUrl(appUri, bucket);
        bridge.getWebView().post(() -> bridge.getWebView().loadUrl(fallbackUrl));
        Logger.warn(getLogTag(), "Blocked non-MVP wrapper path: " + url + " (" + bucket + ")");
        return true;
    }

    private static boolean isSameOrigin(@NonNull Uri left, @NonNull Uri right) {
        return lower(left.getScheme()).equals(lower(right.getScheme())) && lower(left.getAuthority()).equals(lower(right.getAuthority()));
    }

    private static String buildFallbackUrl(@NonNull Uri appUri, @NonNull PathBucket bucket) {
        return appUri
            .buildUpon()
            .path("/start")
            .encodedQuery("wrapper_guard=" + bucket.name().toLowerCase(Locale.ROOT))
            .fragment(null)
            .build()
            .toString();
    }

    private static PathBucket classifyPath(String rawPath) {
        String normalized = normalizePath(rawPath);
        if (normalized == null) {
            return PathBucket.INVALID;
        }

        if (EXACT_EXCLUDED_PATHS.contains(normalized) || matchesPrefix(normalized, PREFIX_EXCLUDED_PATHS)) {
            return PathBucket.EXCLUDED;
        }
        if (EXACT_MVP_PATHS.contains(normalized) || matchesPrefix(normalized, PREFIX_MVP_PATHS)) {
            return PathBucket.MVP;
        }
        if (EXACT_LATER_PATHS.contains(normalized) || matchesPrefix(normalized, PREFIX_LATER_PATHS)) {
            return PathBucket.LATER;
        }
        return PathBucket.UNKNOWN;
    }

    private static boolean matchesPrefix(@NonNull String path, @NonNull String[] prefixes) {
        for (String prefix : prefixes) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private static String normalizePath(String input) {
        if (input == null) {
            return "/";
        }
        String trimmed = input.trim();
        if (trimmed.isEmpty()) {
            return "/";
        }
        if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
            return null;
        }
        if (trimmed.length() > 1 && trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private static String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }
}
