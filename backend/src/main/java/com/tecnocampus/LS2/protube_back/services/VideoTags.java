package com.tecnocampus.LS2.protube_back.services;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Cleans the tags typed by users when uploading (US-06) or editing (US-07) a video.
 */
final class VideoTags {

    private VideoTags() {
    }

    /**
     * Trims the tags, drops a leading {@code #}, blank tags and repeated ones (ignoring case), keeping their order.
     */
    static List<String> normalize(List<String> tags) {
        if (tags == null) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>();
        List<String> result = new ArrayList<>();
        for (String tag : tags) {
            if (tag == null) {
                continue;
            }
            String clean = tag.trim().replaceFirst("^#+", "").replaceAll("\s+", " ").trim();
            if (!clean.isEmpty() && seen.add(clean.toLowerCase(Locale.ROOT))) {
                result.add(clean);
            }
        }
        return result;
    }
}
