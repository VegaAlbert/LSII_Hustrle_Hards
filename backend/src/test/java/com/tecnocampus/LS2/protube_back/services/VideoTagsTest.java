package com.tecnocampus.LS2.protube_back.services;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VideoTagsTest {

    @Test
    void normalizesTags() {
        List<String> tags = Arrays.asList("  #Travel ", "travel", "", null, "##road   trip", "Beach");

        assertEquals(List.of("Travel", "road trip", "Beach"), VideoTags.normalize(tags));
    }

    @Test
    void returnsNoTagsForNull() {
        assertEquals(List.of(), VideoTags.normalize(null));
    }
}
