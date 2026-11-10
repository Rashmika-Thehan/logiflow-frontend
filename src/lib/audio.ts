/** Short two tone alert, generated in the browser so no audio asset is needed. */
export function playAlertTone() {
    try {
        const Ctx = window.AudioContext;
        const ctx = new Ctx();
        const now = ctx.currentTime;
        [660, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, now + i * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.18 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + i * 0.18);
            osc.stop(now + i * 0.18 + 0.2);
        });
        setTimeout(() => void ctx.close(), 600);
    } catch {
        /* Browsers block audio until the user has interacted with the page. */
    }
}