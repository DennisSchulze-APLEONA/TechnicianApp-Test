// Loaded before Blazor starts: Chromium fires beforeinstallprompt early and only once per page load.
(function () {
    let deferredPrompt = null;
    let listener = null;

    const isStandalone = () =>
        window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // iPadOS reports itself as a Mac, so also check for touch.
    const isIos = () =>
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const currentMode = () => {
        if (isStandalone()) return 'none';
        if (deferredPrompt) return 'prompt';
        if (isIos()) return 'ios';
        return 'none';
    };

    const notify = () => listener && listener.invokeMethodAsync('SetInstallMode', currentMode());

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        notify();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        notify();
    });

    window.techApp = {
        isStandalone,

        installMode(dotNetRef) {
            listener = dotNetRef;
            return currentMode();
        },

        forgetInstallListener(dotNetRef) {
            if (listener === dotNetRef) listener = null;
        },

        async promptInstall() {
            if (!deferredPrompt) return currentMode();
            const prompt = deferredPrompt;
            deferredPrompt = null;
            prompt.prompt();
            await prompt.userChoice;
            return currentMode();
        },

        // Same tab, so an installed app keeps the target inside its own window instead of opening a browser.
        launch(url) {
            window.location.assign(url);
        }
    };
})();
