import { crossfade, fade, scale } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

export const [send, receive] = crossfade({
  duration: 300,
  easing: cubicOut,
  fallback(node) {
    const style = getComputedStyle(node);
    const opacity = +style.opacity;
    return {
      duration: 300,
      easing: cubicOut,
      css: t => `opacity: ${t * opacity}`
    };
  }
});
