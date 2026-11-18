package com.tecnocampus.LS2.protube_back.configuration;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

/**
 * i18n: the API answers its error messages in the language of the Accept-Language header (English, Spanish or
 * Catalan), English when the header is missing or asks for another language.
 */
@Configuration
public class LocaleConfig {

    public static final Locale DEFAULT_LOCALE = Locale.ENGLISH;
    public static final List<Locale> SUPPORTED_LOCALES =
            List.of(Locale.ENGLISH, Locale.forLanguageTag("es"), Locale.forLanguageTag("ca"));

    public LocaleConfig() {
        // Outside a request (e.g. a handler called directly) messages are in English, not in the server language
        LocaleContextHolder.setDefaultLocale(DEFAULT_LOCALE);
    }

    /**
     * {@code @EnableWebMvc} (MvcConfig) already registers an AcceptHeaderLocaleResolver named "localeResolver" and a
     * second bean with that name cannot be declared, so that one is configured instead. Without this, a request
     * without the header would use the language of the server.
     */
    @Bean
    public static BeanPostProcessor acceptHeaderLocaleResolverConfigurer() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof AcceptHeaderLocaleResolver resolver) {
                    resolver.setSupportedLocales(SUPPORTED_LOCALES);
                    resolver.setDefaultLocale(DEFAULT_LOCALE);
                }
                return bean;
            }
        };
    }
}
