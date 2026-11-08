export const THEME_KEY = 'sv-theme'
/** Скрипт до отрисовки: применяет сохранённую тему без «вспышки». */
export const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`
