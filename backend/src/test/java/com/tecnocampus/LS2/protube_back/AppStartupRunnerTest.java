package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.services.VideoStoreImporter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;

import java.nio.file.Paths;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AppStartupRunnerTest {

    @Mock
    VideoStoreImporter videoStoreImporter;

    private AppStartupRunner runner(String loadInitialData) {
        MockEnvironment env = new MockEnvironment()
                .withProperty("pro_tube.store.dir", "store")
                .withProperty("pro_tube.load_initial_data", loadInitialData);
        return new AppStartupRunner(env, videoStoreImporter);
    }

    @Test
    void importsTheStoreWhenInitialDataIsEnabled() {
        runner("true").run(null);

        verify(videoStoreImporter).importFrom(Paths.get("store"));
    }

    @Test
    void doesNotImportWhenInitialDataIsDisabled() {
        runner("false").run(null);

        verify(videoStoreImporter, never()).importFrom(any());
    }
}
