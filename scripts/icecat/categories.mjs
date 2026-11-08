// Категории каталога из Open Icecat: ID категории Icecat, характеристики и подписи на 10 языках.
// Один источник правды: из него импорт берёт маппинг (mapByConfig), а gen-sql.mjs строит миграцию.
// Признаки Icecat — по ID (глобальные), запасной вариант — по английскому названию.
// Лицензия OCL §10: данные Icecat только таблицей/фото, не в генеративный ИИ.

import { flatFeatures } from './map.mjs'

export const LANGS = ['en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'sv', 'pt-br', 'ja']

// ---------- преобразования значений ----------
const num = (f) => {
  if (!f || f.raw === '') return null
  const n = Number(String(f.raw).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}
const txt = (f) => {
  const t = f?.raw?.trim()
  return t && !/^(not available|n\/a|-)$/i.test(t) ? t : null
}
const yn = (f) => (!f || f.raw === '' ? null : f.raw === 'Y' ? true : f.raw === 'N' ? false : null)
const gb = (f) => {
  const n = num(f); if (n == null) return null
  const u = f.unit.toUpperCase()
  return u === 'MB' ? Math.round((n / 1024) * 100) / 100 : u === 'TB' ? n * 1024 : n
}
const res = (f) => { const m = /(\d+)\s*x\s*(\d+)/i.exec(f?.raw ?? ''); return m ? `${m[1]} × ${m[2]}` : null }
const kg = (f) => { const n = num(f); if (n == null) return null; return f.unit === 'kg' ? n : Math.round(n / 10) / 100 }
const hours = (f) => { const n = num(f); if (n == null) return null; return f.unit === 'min' ? Math.round((n / 60) * 10) / 10 : n }
const hz = (f) => { const t = txt(f); if (!t) return null; return /hz/i.test(t) ? t : `${t} Hz` }
const C = { num, txt, yn, gb, res, kg, hours, hz }

/** Спец-правила: значение из нескольких признаков. g(id|re) → признак. */
const SPECIAL = {
  cpu: (g) => {
    const fam = txt(g([2196, /^processor family$/i])), mdl = txt(g([47, /^processor model$/i]))
    return fam && mdl ? (mdl.toLowerCase().includes(fam.toLowerCase()) ? mdl : `${fam} ${mdl}`) : (mdl ?? fam)
  },
  gpu: (g) => txt(g([9018, /^discrete graphics card model$/i])) ?? txt(g([9016, /^on-board graphics card model$/i])),
  anc: (g) => {
    const t = txt(g([39802, /^noise canceling type$/i]))
    if (t) return /active/i.test(t)
    return null
  },
  curved: (g) => { const t = txt(g([17554, /^screen shape$/i])); return t ? /curved/i.test(t) : null },
  expandable: (g) => {
    const f = g([null, /memory card slot|compatible memory cards|maximum memory card size/i])
    return f ? f.raw !== 'N' : null
  },
  cellular: (g) => {
    const t = txt(g([40629, /^mobile network generation$/i]))
    if (t) return t
    const n = g([24557, /^mobile network connection$/i])
    return n?.raw === 'N' ? 'Wi-Fi' : null
  },
  usb: (g) => {
    const t = txt(g([1742, /^USB connector type$/i])) ?? txt(g([26352, /^USB connector$/i])), v = txt(g([8541, /^USB version$/i]))
    return t ? (v ? `${t} (${v})` : t) : null
  },
  wifi: (g) => txt(g([24993, /^top wi-fi standard$/i])) ?? txt(g([432, /^wi-fi standards$/i]))?.split(',')[0] ?? null,
  jack: (g) => {
    const a = g([14760, /^3\.5 mm connector$/i]); if (a) return yn(a)
    const t = txt(g([4163, /^headphone connectivity$/i])); return t ? /3\.5/.test(t) : null
  },
}

// ---------- подписи групп (новые; display/performance/camera/battery/body/connectivity/software уже в 0002) ----------
export const GROUP_LABELS = {
  audio:    ['Sound', 'Klang', 'Son', 'Audio', 'Sonido', 'Geluid', 'Dźwięk', 'Ljud', 'Som', 'サウンド'],
  picture:  ['Picture', 'Bild', 'Image', 'Immagine', 'Imagen', 'Beeld', 'Obraz', 'Bild', 'Imagem', '画質'],
  smart:    ['Smart features', 'Smart-Funktionen', 'Fonctions connectées', 'Funzioni smart', 'Funciones inteligentes', 'Slimme functies', 'Funkcje smart', 'Smarta funktioner', 'Recursos inteligentes', 'スマート機能'],
  ports:    ['Ports', 'Anschlüsse', 'Connectique', 'Porte', 'Puertos', 'Aansluitingen', 'Złącza', 'Anslutningar', 'Portas', '端子'],
  energy:   ['Energy', 'Energie', 'Énergie', 'Energia', 'Energía', 'Energie', 'Energia', 'Energi', 'Energia', 'エネルギー'],
  health:   ['Health & fitness', 'Gesundheit & Fitness', 'Santé & forme', 'Salute e fitness', 'Salud y fitness', 'Gezondheid & fitness', 'Zdrowie i fitness', 'Hälsa & träning', 'Saúde e fitness', '健康・フィットネス'],
  graphics: ['Graphics', 'Grafik', 'Graphismes', 'Grafica', 'Gráficos', 'Graphics', 'Grafika', 'Grafik', 'Gráficos', 'グラフィックス'],
}

// ---------- подписи характеристик (ключи, которых нет в 0002 или с другим смыслом) ----------
export const LABELS = {
  wearing_style:   ['Wearing style', 'Tragestil', 'Type de port', 'Tipo di indossamento', 'Tipo de uso', 'Draagwijze', 'Sposób noszenia', 'Bärstil', 'Estilo de uso', '装着方式'],
  ear_coupling:    ['Ear coupling', 'Ohrankopplung', 'Couplage auriculaire', 'Accoppiamento', 'Acoplamiento', 'Oorkoppeling', 'Typ przylegania', 'Öronkoppling', 'Acoplamento', 'イヤーカップ形状'],
  connection:      ['Connection', 'Verbindung', 'Connexion', 'Connessione', 'Conexión', 'Verbinding', 'Połączenie', 'Anslutning', 'Conexão', '接続方式'],
  anc:             ['Active noise cancelling', 'Aktive Geräuschunterdrückung', 'Réduction de bruit active', 'Cancellazione attiva del rumore', 'Cancelación activa de ruido', 'Actieve ruisonderdrukking', 'Aktywna redukcja szumów', 'Aktiv brusreducering', 'Cancelamento ativo de ruído', 'アクティブノイズキャンセリング'],
  driver_size:     ['Driver size', 'Treibergröße', 'Taille du haut-parleur', 'Dimensione driver', 'Tamaño del driver', 'Drivergrootte', 'Rozmiar przetwornika', 'Elementstorlek', 'Tamanho do driver', 'ドライバー径'],
  frequency_range: ['Frequency range', 'Frequenzbereich', 'Bande passante', 'Risposta in frequenza', 'Rango de frecuencia', 'Frequentiebereik', 'Pasmo przenoszenia', 'Frekvensomfång', 'Faixa de frequência', '周波数帯域'],
  impedance:       ['Impedance', 'Impedanz', 'Impédance', 'Impedenza', 'Impedancia', 'Impedantie', 'Impedancja', 'Impedans', 'Impedância', 'インピーダンス'],
  sensitivity:     ['Sensitivity', 'Empfindlichkeit', 'Sensibilité', 'Sensibilità', 'Sensibilidad', 'Gevoeligheid', 'Czułość', 'Känslighet', 'Sensibilidade', '感度'],
  microphone:      ['Microphone', 'Mikrofon', 'Microphone', 'Microfono', 'Micrófono', 'Microfoon', 'Mikrofon', 'Mikrofon', 'Microfone', 'マイク'],
  battery_life:    ['Battery life', 'Akkulaufzeit', 'Autonomie', 'Autonomia', 'Autonomía', 'Accuduur', 'Czas pracy na baterii', 'Batteritid', 'Autonomia da bateria', '連続使用時間'],
  charging_time:   ['Charging time', 'Ladezeit', 'Temps de charge', 'Tempo di ricarica', 'Tiempo de carga', 'Oplaadtijd', 'Czas ładowania', 'Laddningstid', 'Tempo de carga', '充電時間'],
  fast_charging:   ['Fast charging', 'Schnellladen', 'Charge rapide', 'Ricarica rapida', 'Carga rápida', 'Snelladen', 'Szybkie ładowanie', 'Snabbladdning', 'Carregamento rápido', '急速充電'],
  wireless_charging_support: ['Wireless charging', 'Kabelloses Laden', 'Charge sans fil', 'Ricarica wireless', 'Carga inalámbrica', 'Draadloos laden', 'Ładowanie bezprzewodowe', 'Trådlös laddning', 'Carregamento sem fio', 'ワイヤレス充電'],
  multipoint:      ['Simultaneous devices', 'Gleichzeitige Geräte', 'Appareils simultanés', 'Dispositivi simultanei', 'Dispositivos simultáneos', 'Gelijktijdige apparaten', 'Jednoczesne urządzenia', 'Samtidiga enheter', 'Dispositivos simultâneos', '同時接続台数'],
  foldable:        ['Foldable', 'Faltbar', 'Pliable', 'Pieghevole', 'Plegable', 'Opvouwbaar', 'Składane', 'Hopfällbar', 'Dobrável', '折りたたみ'],
  resolution_class:['Resolution class', 'Auflösungsklasse', 'Définition', 'Risoluzione', 'Resolución', 'Resolutieklasse', 'Klasa rozdzielczości', 'Upplösningsklass', 'Classe de resolução', '解像度クラス'],
  hdr:             ['HDR formats', 'HDR-Formate', 'Formats HDR', 'Formati HDR', 'Formatos HDR', 'HDR-formaten', 'Formaty HDR', 'HDR-format', 'Formatos HDR', 'HDR規格'],
  dolby_vision:    ['Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision'],
  picture_processor:['Picture processor', 'Bildprozessor', "Processeur d'image", 'Processore video', 'Procesador de imagen', 'Beeldprocessor', 'Procesor obrazu', 'Bildprocessor', 'Processador de imagem', '映像エンジン'],
  speaker_power:   ['Speaker power', 'Lautsprecherleistung', 'Puissance audio', 'Potenza audio', 'Potencia de audio', 'Luidsprekervermogen', 'Moc głośników', 'Högtalareffekt', 'Potência de áudio', 'スピーカー出力'],
  audio_channels:  ['Audio channels', 'Audiokanäle', 'Canaux audio', 'Canali audio', 'Canales de audio', 'Audiokanalen', 'Kanały audio', 'Ljudkanaler', 'Canais de áudio', 'チャンネル'],
  smart_tv:        ['Smart TV', 'Smart-TV', 'Smart TV', 'Smart TV', 'Smart TV', 'Smart-tv', 'Smart TV', 'Smart-TV', 'Smart TV', 'スマートTV'],
  hdmi_ports:      ['HDMI ports', 'HDMI-Anschlüsse', 'Ports HDMI', 'Porte HDMI', 'Puertos HDMI', 'HDMI-poorten', 'Porty HDMI', 'HDMI-portar', 'Portas HDMI', 'HDMI端子数'],
  hdmi_version:    ['HDMI version', 'HDMI-Version', 'Version HDMI', 'Versione HDMI', 'Versión HDMI', 'HDMI-versie', 'Wersja HDMI', 'HDMI-version', 'Versão HDMI', 'HDMIバージョン'],
  earc:            ['eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC'],
  freesync:        ['AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync'],
  gsync:           ['NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC'],
  energy_class:    ['Energy class', 'Energieeffizienzklasse', 'Classe énergétique', 'Classe energetica', 'Clase energética', 'Energieklasse', 'Klasa energetyczna', 'Energiklass', 'Classe energética', '省エネ等級'],
  power_typical:   ['Power consumption', 'Leistungsaufnahme', 'Consommation', 'Consumo', 'Consumo', 'Stroomverbruik', 'Pobór mocy', 'Effektförbrukning', 'Consumo de energia', '消費電力'],
  weight_kg:       ['Weight', 'Gewicht', 'Poids', 'Peso', 'Peso', 'Gewicht', 'Waga', 'Vikt', 'Peso', '重量'],
  depth_mm:        ['Depth', 'Tiefe', 'Profondeur', 'Profondità', 'Profundidad', 'Diepte', 'Głębokość', 'Djup', 'Profundidade', '奥行き'],
  vesa:            ['VESA mount', 'VESA-Halterung', 'Fixation VESA', 'Attacco VESA', 'Montaje VESA', 'VESA-bevestiging', 'Mocowanie VESA', 'VESA-fäste', 'Suporte VESA', 'VESAマウント'],
  touchscreen:     ['Touchscreen', 'Touchscreen', 'Écran tactile', 'Touchscreen', 'Pantalla táctil', 'Touchscreen', 'Ekran dotykowy', 'Pekskärm', 'Tela sensível ao toque', 'タッチスクリーン'],
  cpu:             ['Processor', 'Prozessor', 'Processeur', 'Processore', 'Procesador', 'Processor', 'Procesor', 'Processor', 'Processador', 'プロセッサー'],
  cpu_threads:     ['Processor threads', 'Prozessor-Threads', 'Threads', 'Thread', 'Hilos', 'Threads', 'Wątki procesora', 'Trådar', 'Threads', 'スレッド数'],
  cpu_boost:       ['Boost clock', 'Boost-Takt', 'Fréquence turbo', 'Frequenza turbo', 'Frecuencia turbo', 'Boostfrequentie', 'Taktowanie turbo', 'Boostfrekvens', 'Frequência turbo', '最大クロック'],
  ram_type:        ['Memory type', 'Speichertyp', 'Type de mémoire', 'Tipo di memoria', 'Tipo de memoria', 'Geheugentype', 'Typ pamięci', 'Minnestyp', 'Tipo de memória', 'メモリー種類'],
  storage_type:    ['Storage type', 'Speicherart', 'Type de stockage', 'Tipo di archiviazione', 'Tipo de almacenamiento', 'Opslagtype', 'Typ dysku', 'Lagringstyp', 'Tipo de armazenamento', 'ストレージ種類'],
  gpu:             ['Graphics', 'Grafikkarte', 'Carte graphique', 'Scheda grafica', 'Tarjeta gráfica', 'Videokaart', 'Karta graficzna', 'Grafikkort', 'Placa de vídeo', 'グラフィックス'],
  discrete_gpu:    ['Dedicated graphics', 'Dedizierte Grafik', 'Graphique dédiée', 'Grafica dedicata', 'Gráfica dedicada', 'Losse videokaart', 'Dedykowana grafika', 'Dedikerad grafik', 'Placa de vídeo dedicada', '専用GPU'],
  battery_wh:      ['Battery capacity', 'Akkukapazität', 'Capacité de la batterie', 'Capacità batteria', 'Capacidad de batería', 'Accucapaciteit', 'Pojemność baterii', 'Batterikapacitet', 'Capacidade da bateria', 'バッテリー容量'],
  adapter_power:   ['Power adapter', 'Netzteilleistung', "Puissance de l'adaptateur", 'Potenza alimentatore', 'Potencia del adaptador', 'Adaptervermogen', 'Moc zasilacza', 'Nätadapter', 'Potência do carregador', 'ACアダプター出力'],
  keyboard_backlit:['Backlit keyboard', 'Beleuchtete Tastatur', 'Clavier rétroéclairé', 'Tastiera retroilluminata', 'Teclado retroiluminado', 'Verlicht toetsenbord', 'Podświetlana klawiatura', 'Bakgrundsbelyst tangentbord', 'Teclado retroiluminado', 'バックライトキーボード'],
  fingerprint:     ['Fingerprint reader', 'Fingerabdruckleser', "Lecteur d'empreintes", 'Lettore di impronte', 'Lector de huellas', 'Vingerafdrukscanner', 'Czytnik linii papilarnych', 'Fingeravtrycksläsare', 'Leitor de impressão digital', '指紋センサー'],
  cellular:        ['Mobile network', 'Mobilfunk', 'Réseau mobile', 'Rete mobile', 'Red móvil', 'Mobiel netwerk', 'Sieć komórkowa', 'Mobilnät', 'Rede móvel', 'モバイル通信'],
  always_on:       ['Always-on display', 'Always-on-Display', 'Écran toujours allumé', 'Display always-on', 'Pantalla siempre activa', 'Always-on-display', 'Always-on display', 'Alltid på-skärm', 'Tela sempre ativa', '常時表示'],
  case_size:       ['Case size', 'Gehäusegröße', 'Taille du boîtier', 'Dimensione cassa', 'Tamaño de caja', 'Kastgrootte', 'Rozmiar koperty', 'Boettstorlek', 'Tamanho da caixa', 'ケースサイズ'],
  case_material:   ['Case material', 'Gehäusematerial', 'Matériau du boîtier', 'Materiale cassa', 'Material de la caja', 'Kastmateriaal', 'Materiał koperty', 'Boettmaterial', 'Material da caixa', 'ケース素材'],
  water_resistance:['Water resistance', 'Wasserdichtigkeit', "Étanchéité", 'Impermeabilità', 'Resistencia al agua', 'Waterdichtheid', 'Wodoszczelność', 'Vattentäthet', 'Resistência à água', '防水性能'],
  gps:             ['GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS'],
  lte:             ['LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE（eSIM）'],
  heart_rate:      ['Heart rate monitor', 'Herzfrequenzmessung', 'Cardiofréquencemètre', 'Cardiofrequenzimetro', 'Pulsómetro', 'Hartslagmeter', 'Pomiar tętna', 'Pulsmätare', 'Monitor cardíaco', '心拍計'],
  spo2:            ['Blood oxygen (SpO2)', 'Blutsauerstoff (SpO2)', 'Oxygène sanguin (SpO2)', 'Ossigeno nel sangue (SpO2)', 'Oxígeno en sangre (SpO2)', 'Bloedzuurstof (SpO2)', 'Natlenienie krwi (SpO2)', 'Syremättnad (SpO2)', 'Oxigênio no sangue (SpO2)', '血中酸素（SpO2）'],
  ecg:             ['ECG', 'EKG', 'ECG', 'ECG', 'ECG', 'ECG', 'EKG', 'EKG', 'ECG', '心電図'],
  fall_detection:  ['Fall detection', 'Sturzerkennung', 'Détection de chute', 'Rilevamento cadute', 'Detección de caídas', 'Valdetectie', 'Wykrywanie upadków', 'Falldetektering', 'Detecção de queda', '転倒検出'],
  response_time:   ['Response time', 'Reaktionszeit', 'Temps de réponse', 'Tempo di risposta', 'Tiempo de respuesta', 'Responstijd', 'Czas reakcji', 'Svarstid', 'Tempo de resposta', '応答速度'],
  contrast:        ['Contrast ratio', 'Kontrastverhältnis', 'Contraste', 'Contrasto', 'Contraste', 'Contrastverhouding', 'Kontrast', 'Kontrast', 'Contraste', 'コントラスト比'],
  aspect_ratio:    ['Aspect ratio', 'Seitenverhältnis', "Format d'image", 'Formato', 'Relación de aspecto', 'Beeldverhouding', 'Proporcje ekranu', 'Bildformat', 'Proporção', 'アスペクト比'],
  curved:          ['Curved screen', 'Gebogener Bildschirm', 'Écran incurvé', 'Schermo curvo', 'Pantalla curva', 'Gebogen scherm', 'Zakrzywiony ekran', 'Böjd skärm', 'Tela curva', '曲面ディスプレイ'],
  srgb:            ['sRGB coverage', 'sRGB-Abdeckung', 'Couverture sRGB', 'Copertura sRGB', 'Cobertura sRGB', 'sRGB-dekking', 'Pokrycie sRGB', 'sRGB-täckning', 'Cobertura sRGB', 'sRGBカバー率'],
  hdr_support:     ['HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR'],
  displayport:     ['DisplayPort version', 'DisplayPort-Version', 'Version DisplayPort', 'Versione DisplayPort', 'Versión DisplayPort', 'DisplayPort-versie', 'Wersja DisplayPort', 'DisplayPort-version', 'Versão DisplayPort', 'DisplayPortバージョン'],
  speakers:        ['Built-in speakers', 'Integrierte Lautsprecher', 'Haut-parleurs intégrés', 'Altoparlanti integrati', 'Altavoces integrados', 'Ingebouwde luidsprekers', 'Wbudowane głośniki', 'Inbyggda högtalare', 'Alto-falantes integrados', '内蔵スピーカー'],
  height_adjust:   ['Height adjustment', 'Höhenverstellung', 'Réglage en hauteur', 'Regolazione altezza', 'Ajuste de altura', 'Hoogteverstelling', 'Regulacja wysokości', 'Höjdjustering', 'Ajuste de altura', '高さ調整'],
  speaker_type:    ['Speaker type', 'Lautsprechertyp', "Type d'enceinte", 'Tipo di altoparlante', 'Tipo de altavoz', 'Type luidspreker', 'Typ głośnika', 'Högtalartyp', 'Tipo de alto-falante', 'スピーカー種類'],
  drivers:         ['Number of drivers', 'Anzahl der Treiber', 'Nombre de haut-parleurs', 'Numero di driver', 'Número de altavoces', 'Aantal drivers', 'Liczba przetworników', 'Antal element', 'Número de drivers', 'スピーカー数'],
  airplay:         ['AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay'],
  wifi_support:    ['Wi-Fi', 'WLAN', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi', 'Wifi', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi'],
  handsfree:       ['Hands-free calls', 'Freisprechen', 'Mains libres', 'Vivavoce', 'Manos libres', 'Handsfree bellen', 'Zestaw głośnomówiący', 'Handsfree', 'Viva-voz', 'ハンズフリー通話'],
  ip_rating:       ['Water & dust (IP)', 'Wasser- & Staubschutz (IP)', 'Étanchéité (IP)', 'Protezione (IP)', 'Protección (IP)', 'Water- en stofdicht (IP)', 'Odporność (IP)', 'Vatten- & dammskydd (IP)', 'Proteção (IP)', '防水防塵（IP）'],
  bluetooth:       ['Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth'],
}

// s(key, group, type, unit, higherIsBetter, keySpec, filter, pick | special-name, conv)
const s = (key, group, type, unit, hib, isKey, isFilter, pick, conv = type === 'bool' ? 'yn' : type === 'text' ? 'txt' : 'num') =>
  ({ key, group, type, unit, hib, isKey, isFilter, pick, conv })

// ---------- категории ----------
export const CATEGORIES = {
  headphones: {
    catid: '1637', sort: 30, min: 8, codeAsName: false,
    i18n: { en: ['headphones', 'Headphones'], de: ['kopfhoerer', 'Kopfhörer'], fr: ['casques-ecouteurs', 'Casques & écouteurs'], it: ['cuffie', 'Cuffie'], es: ['auriculares', 'Auriculares'], nl: ['koptelefoons', 'Koptelefoons'], pl: ['sluchawki', 'Słuchawki'], sv: ['horlurar', 'Hörlurar'], 'pt-br': ['fones-de-ouvido', 'Fones de ouvido'], ja: ['headphones', 'ヘッドホン・イヤホン'] },
    specs: [
      s('wearing_style', 'body', 'text', null, null, true, true, [8136, /^wearing style$/i]),
      s('ear_coupling', 'body', 'text', null, null, false, false, [2527, /^ear coupling$/i]),
      s('connection', 'connectivity', 'text', null, null, true, true, [1655, /^connectivity technology$/i]),
      s('anc', 'audio', 'bool', null, true, true, true, 'anc'),
      s('driver_size', 'audio', 'number', 'mm', true, false, false, [2379, /^driver unit$/i]),
      s('frequency_range', 'audio', 'text', null, null, false, false, [1887, /^headphone frequency$/i], 'hz'),
      s('impedance', 'audio', 'number', 'Ω', null, false, false, [1889, /^impedance$/i]),
      s('sensitivity', 'audio', 'number', 'dB', true, false, false, [1888, /^headphone sensitivity$/i]),
      s('microphone', 'audio', 'bool', null, true, false, true, [2314, /^microphone in$/i]),
      s('battery_life', 'battery', 'number', 'h', true, true, true, [[2169, /^continuous audio playback time$/i], [42969, /playback time \(anc off\)/i], [13910, /^battery life$/i]], 'hours'),
      s('charging_time', 'battery', 'number', 'h', false, false, false, [1535, /^battery recharge time$/i], 'hours'),
      s('fast_charging', 'battery', 'bool', null, true, false, false, [4981, /^fast charging$/i]),
      s('wireless_charging_support', 'battery', 'bool', null, true, false, true, [12148, /^wireless charging$/i]),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('multipoint', 'connectivity', 'number', null, true, false, false, [9686, /simultaneously connected devices/i]),
      s('usb', 'connectivity', 'text', null, null, false, false, 'usb'),
      s('headphone_jack', 'connectivity', 'bool', null, true, false, false, 'jack'),
      s('ip_rating', 'body', 'text', null, null, false, true, [7900, /international protection \(ip\) code/i]),
      s('foldable', 'body', 'bool', null, null, false, false, [2882, /^foldable$/i]),
      s('weight', 'body', 'number', 'g', false, true, false, [94, /^weight$/i]),
    ],
  },

  laptops: {
    catid: '151', sort: 20, min: 10, codeAsName: false,
    i18n: { en: ['laptops', 'Laptops'], de: ['laptops', 'Laptops'], fr: ['ordinateurs-portables', 'Ordinateurs portables'], it: ['notebook', 'Notebook'], es: ['portatiles', 'Portátiles'], nl: ['laptops', 'Laptops'], pl: ['laptopy', 'Laptopy'], sv: ['barbara-datorer', 'Bärbara datorer'], 'pt-br': ['notebooks', 'Notebooks'], ja: ['laptops', 'ノートパソコン'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_resolution', 'display', 'text', null, null, false, true, [1585, /^display resolution$/i], 'res'),
      s('display_type', 'display', 'text', null, null, false, true, [15285, /^panel type$/i]),
      s('refresh_rate', 'display', 'number', 'Hz', true, false, true, [7450, /^maximum refresh rate$/i]),
      s('peak_brightness', 'display', 'number', 'nits', true, false, false, [1389, /^display brightness$/i]),
      s('touchscreen', 'display', 'bool', null, null, false, true, [4963, /^touchscreen$/i]),
      s('cpu', 'performance', 'text', null, null, true, true, 'cpu'),
      s('cpu_threads', 'performance', 'number', null, true, false, false, [7337, /^processor threads$/i]),
      s('cpu_boost', 'performance', 'number', 'GHz', true, false, false, [7978, /^processor boost frequency$/i]),
      s('ram', 'performance', 'number', 'GB', true, true, true, [11381, /^internal memory$/i], 'gb'),
      s('ram_type', 'performance', 'text', null, null, false, false, [427, /^internal memory type$/i]),
      s('storage', 'performance', 'number', 'GB', true, true, true, [3318, /^total storage capacity$/i], 'gb'),
      s('storage_type', 'performance', 'text', null, null, false, false, [11441, /^storage media$/i]),
      s('gpu', 'graphics', 'text', null, null, true, true, 'gpu'),
      s('discrete_gpu', 'graphics', 'bool', null, true, false, true, [27905, /^discrete graphics card$/i]),
      s('battery_wh', 'battery', 'number', 'Wh', true, false, false, [8519, /^battery capacity$/i]),
      s('battery_life', 'battery', 'number', 'h', true, false, true, [1721, /^battery life \(max\)$/i], 'hours'),
      s('adapter_power', 'battery', 'number', 'W', null, false, false, [906, /^AC adapter power$/i]),
      s('wifi', 'connectivity', 'text', null, null, false, false, 'wifi'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('keyboard_backlit', 'body', 'bool', null, true, false, true, [11149, /^keyboard backlit$/i]),
      s('fingerprint', 'body', 'bool', null, true, false, false, [3577, /^fingerprint reader$/i]),
      s('os', 'software', 'text', null, null, false, true, [3233, /^operating system installed$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, true, true, [94, /^weight$/i], 'kg'),
      s('thickness', 'body', 'number', 'mm', false, false, false, [1464, /^height$/i]),
    ],
  },

  tvs: {
    catid: '1584', sort: 40, min: 10, codeAsName: true,
    i18n: { en: ['tvs', 'TVs'], de: ['fernseher', 'Fernseher'], fr: ['televiseurs', 'Téléviseurs'], it: ['televisori', 'Televisori'], es: ['televisores', 'Televisores'], nl: ['televisies', 'Televisies'], pl: ['telewizory', 'Telewizory'], sv: ['tv-apparater', 'TV-apparater'], 'pt-br': ['tvs', 'TVs'], ja: ['tvs', 'テレビ'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('resolution_class', 'display', 'text', null, null, true, true, [11424, /^HD type$/i]),
      s('display_resolution', 'display', 'text', null, null, false, false, [1585, /^display resolution$/i], 'res'),
      s('display_type', 'display', 'text', null, null, true, true, [9713, /^display technology$/i]),
      s('refresh_rate', 'display', 'number', 'Hz', true, false, true, [[35746, /^native refresh rate$/i], [7450, /^maximum refresh rate$/i]]),
      s('hdr', 'picture', 'text', null, null, false, false, [40712, /high dynamic range \(hdr\) technology/i]),
      s('dolby_vision', 'picture', 'bool', null, true, false, true, [39354, /^dolby vision$/i]),
      s('picture_processor', 'picture', 'text', null, null, false, false, [20225, /^processor$/i]),
      s('speaker_power', 'audio', 'number', 'W', true, false, false, [1854, /^RMS rated power$/i]),
      s('audio_channels', 'audio', 'text', null, null, false, false, [2197, /^audio output channels$/i]),
      s('smart_tv', 'smart', 'bool', null, true, false, true, [9841, /^smart tv$/i]),
      s('os', 'smart', 'text', null, null, false, true, [3233, /^operating system installed$/i]),
      s('hdmi_ports', 'ports', 'number', null, true, false, false, [3566, /^HDMI ports quantity$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('earc', 'ports', 'bool', null, true, false, false, [39356, /enhanced audio return channel/i]),
      s('freesync', 'picture', 'bool', null, true, false, false, [29607, /^AMD FreeSync$/i]),
      s('wifi', 'connectivity', 'text', null, null, false, false, 'wifi'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('energy_class', 'energy', 'text', null, null, false, true, [[42856, /^energy efficiency class \(SDR\)$/i], [2705, /^energy efficiency class$/i]]),
      s('power_typical', 'energy', 'number', 'W', false, false, false, [445, /^power consumption \(typical\)$/i]),
      s('vesa', 'body', 'text', null, null, false, false, [4037, /^panel mounting interface$/i]),
      s('depth_mm', 'body', 'number', 'mm', false, false, false, [12577, /^depth \(without stand\)$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, false, false, [12573, /^weight \(without stand\)$/i], 'kg'),
    ],
  },

  tablets: {
    catid: '897', sort: 50, min: 10, codeAsName: false,
    i18n: { en: ['tablets', 'Tablets'], de: ['tablets', 'Tablets'], fr: ['tablettes', 'Tablettes'], it: ['tablet', 'Tablet'], es: ['tablets', 'Tablets'], nl: ['tablets', 'Tablets'], pl: ['tablety', 'Tablety'], sv: ['surfplattor', 'Surfplattor'], 'pt-br': ['tablets', 'Tablets'], ja: ['tablets', 'タブレット'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_resolution', 'display', 'text', null, null, false, false, [1585, /^display resolution$/i], 'res'),
      s('display_type', 'display', 'text', null, null, false, true, [[46952, /display technology marketing name/i], [15285, /^panel type$/i], [9713, /^display technology$/i]]),
      s('refresh_rate', 'display', 'number', 'Hz', true, false, true, [7450, /^maximum refresh rate$/i]),
      s('chipset', 'performance', 'text', null, null, true, true, 'cpu'),
      s('ram', 'performance', 'number', 'GB', true, true, true, [[7861, /^RAM capacity$/i], [11381, /^internal memory$/i]], 'gb'),
      s('storage', 'performance', 'number', 'GB', true, false, true, [[8730, /^internal storage capacity$/i], [3318, /^total storage capacity$/i]], 'gb'),
      s('expandable_storage', 'performance', 'bool', null, true, false, true, 'expandable'),
      s('main_camera', 'camera', 'number', 'MP', true, false, false, [12435, /^rear camera resolution \(numeric\)$/i]),
      s('front_camera', 'camera', 'number', 'MP', true, false, false, [12437, /^front camera resolution \(numeric\)$/i]),
      s('battery', 'battery', 'number', 'mAh', true, true, true, [909, /^battery capacity$/i]),
      s('cellular', 'connectivity', 'text', null, null, false, true, 'cellular'),
      s('wifi', 'connectivity', 'text', null, null, false, false, 'wifi'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('usb', 'connectivity', 'text', null, null, false, false, 'usb'),
      s('headphone_jack', 'connectivity', 'bool', null, true, false, true, 'jack'),
      s('os', 'software', 'text', null, null, false, true, [3233, /^operating system installed$/i]),
      s('weight', 'body', 'number', 'g', false, true, false, [94, /^weight$/i]),
      s('thickness', 'body', 'number', 'mm', false, false, false, [1650, /^depth$/i]),
    ],
  },

  smartwatches: {
    catid: '2647', sort: 80, min: 8, codeAsName: false,
    i18n: { en: ['smartwatches', 'Smartwatches'], de: ['smartwatches', 'Smartwatches'], fr: ['montres-connectees', 'Montres connectées'], it: ['smartwatch', 'Smartwatch'], es: ['relojes-inteligentes', 'Relojes inteligentes'], nl: ['smartwatches', 'Smartwatches'], pl: ['smartwatche', 'Smartwatche'], sv: ['smartklockor', 'Smartklockor'], 'pt-br': ['smartwatches', 'Smartwatches'], ja: ['smartwatches', 'スマートウォッチ'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_type', 'display', 'text', null, null, false, true, [[46952, /display technology marketing name/i], [9713, /^display technology$/i]]),
      s('display_resolution', 'display', 'text', null, null, false, false, [1585, /^display resolution$/i], 'res'),
      s('peak_brightness', 'display', 'number', 'nits', true, false, false, [1389, /^display brightness$/i]),
      s('always_on', 'display', 'bool', null, true, false, true, [39552, /^always-on display$/i]),
      s('case_size', 'body', 'number', 'mm', null, true, true, [42415, /^watch case size$/i]),
      s('case_material', 'body', 'text', null, null, false, true, [42418, /^watch case material$/i]),
      s('ip_rating', 'body', 'text', null, null, false, false, [7900, /international protection \(ip\) code/i]),
      s('water_resistance', 'body', 'text', null, null, false, true, [18048, /^water resistance$/i]),
      s('os', 'software', 'text', null, null, true, true, [3233, /^operating system installed$/i]),
      s('gps', 'health', 'bool', null, true, false, true, [3329, /^GPS \(satellite\)$/i]),
      s('heart_rate', 'health', 'bool', null, true, false, false, [6702, /^heart rate monitor$/i]),
      s('spo2', 'health', 'bool', null, true, false, true, [42444, /^blood oxygen sensor$/i]),
      s('ecg', 'health', 'bool', null, true, false, true, [null, /electrocardiogram|\bECG\b/i]),
      s('fall_detection', 'health', 'bool', null, true, false, false, [39896, /^fall detection$/i]),
      s('lte', 'connectivity', 'bool', null, true, false, true, [24557, /^mobile network connection$/i]),
      s('nfc', 'connectivity', 'bool', null, true, false, true, [10157, /near field communication/i]),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('battery', 'battery', 'number', 'mAh', true, true, false, [909, /^battery capacity$/i]),
      s('battery_life', 'battery', 'number', 'h', true, false, true, [null, /^battery life( \(max\))?$/i], 'hours'),
      s('wireless_charging_support', 'battery', 'bool', null, true, false, false, [12148, /^wireless charging$/i]),
      s('weight', 'body', 'number', 'g', false, false, false, [94, /^weight$/i]),
      s('thickness', 'body', 'number', 'mm', false, false, false, [2757, /^thickness$/i]),
    ],
  },

  monitors: {
    catid: '222', sort: 90, min: 10, codeAsName: true,
    i18n: { en: ['monitors', 'Monitors'], de: ['monitore', 'Monitore'], fr: ['ecrans-pc', 'Écrans PC'], it: ['monitor', 'Monitor'], es: ['monitores', 'Monitores'], nl: ['monitoren', 'Monitoren'], pl: ['monitory', 'Monitory'], sv: ['bildskarmar', 'Bildskärmar'], 'pt-br': ['monitores', 'Monitores'], ja: ['monitors', 'モニター'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_resolution', 'display', 'text', null, null, true, true, [1585, /^display resolution$/i], 'res'),
      s('resolution_class', 'display', 'text', null, null, false, true, [11424, /^HD type$/i]),
      s('display_type', 'display', 'text', null, null, false, true, [15285, /^panel type$/i]),
      s('refresh_rate', 'display', 'number', 'Hz', true, true, true, [7450, /^maximum refresh rate$/i]),
      s('response_time', 'display', 'number', 'ms', false, false, true, [1516, /^response time$/i]),
      s('peak_brightness', 'display', 'number', 'nits', true, false, false, [[36441, /^display brightness \(typical\)$/i], [1389, /^display brightness$/i]]),
      s('contrast', 'display', 'text', null, null, false, false, [34, /^contrast ratio \(typical\)$/i]),
      s('aspect_ratio', 'display', 'text', null, null, false, true, [11417, /^native aspect ratio$/i]),
      s('curved', 'display', 'bool', null, null, false, true, 'curved'),
      s('srgb', 'picture', 'number', '%', true, false, false, [28703, /^sRGB coverage/i]),
      s('hdr_support', 'picture', 'bool', null, true, false, true, [36310, /high dynamic range \(hdr\) supported/i]),
      s('freesync', 'picture', 'bool', null, true, false, true, [29607, /^AMD FreeSync$/i]),
      s('gsync', 'picture', 'bool', null, true, false, true, [20783, /^NVIDIA G-SYNC$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('displayport', 'ports', 'text', null, null, false, false, [11111, /^DisplayPort version$/i]),
      s('speakers', 'audio', 'bool', null, true, false, false, [2433, /^built-in speaker\(s\)$/i]),
      s('height_adjust', 'body', 'bool', null, true, false, true, [1954, /^height adjustment$/i]),
      s('vesa', 'body', 'text', null, null, false, false, [4037, /^panel mounting interface$/i]),
      s('energy_class', 'energy', 'text', null, null, false, false, [[42856, /^energy efficiency class \(SDR\)$/i], [2705, /^energy efficiency class$/i]]),
      s('power_typical', 'energy', 'number', 'W', false, false, false, [445, /^power consumption \(typical\)$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, false, false, [[19017, /^weight \(with stand\)$/i], [12573, /^weight \(without stand\)$/i]], 'kg'),
    ],
  },

  speakers: {
    catid: '2315', sort: 110, min: 8, codeAsName: false,
    i18n: { en: ['speakers', 'Speakers'], de: ['lautsprecher', 'Lautsprecher'], fr: ['enceintes', 'Enceintes'], it: ['casse', 'Casse'], es: ['altavoces', 'Altavoces'], nl: ['speakers', 'Speakers'], pl: ['glosniki', 'Głośniki'], sv: ['hogtalare', 'Högtalare'], 'pt-br': ['caixas-de-som', 'Caixas de som'], ja: ['speakers', 'スピーカー'] },
    specs: [
      s('speaker_type', 'audio', 'text', null, null, true, true, [14052, /^product type$/i]),
      s('speaker_power', 'audio', 'number', 'W', true, true, true, [1854, /^RMS rated power$/i]),
      s('frequency_range', 'audio', 'text', null, null, false, false, [5528, /^frequency range$/i], 'hz'),
      s('drivers', 'audio', 'number', null, true, false, false, [10183, /^number of speakers$/i]),
      s('battery_life', 'battery', 'number', 'h', true, true, true, [1721, /^battery life \(max\)$/i], 'hours'),
      s('charging_time', 'battery', 'number', 'h', false, false, false, [1535, /^battery recharge time$/i], 'hours'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('wifi_support', 'connectivity', 'bool', null, true, false, true, [3239, /^wi-fi$/i]),
      s('airplay', 'connectivity', 'bool', null, true, false, true, [9763, /^airplay$/i]),
      s('nfc', 'connectivity', 'bool', null, true, false, false, [10157, /near field communication/i]),
      s('usb', 'connectivity', 'text', null, null, false, false, 'usb'),
      s('handsfree', 'audio', 'bool', null, true, false, false, [2668, /^hands-free mode$/i]),
      s('ip_rating', 'body', 'text', null, null, false, true, [7900, /international protection \(ip\) code/i]),
      s('weight', 'body', 'number', 'g', false, true, false, [94, /^weight$/i]),
    ],
  },
}

// ---------- волна 2: фото, проекторы, видеокарты, консоли, бытовая техника ----------
Object.assign(GROUP_LABELS, {
  capacity: ['Capacity', 'Fassungsvermögen', 'Capacité', 'Capacità', 'Capacidad', 'Inhoud', 'Pojemność', 'Kapacitet', 'Capacidade', '容量'],
  features: ['Features', 'Ausstattung', 'Équipement', 'Dotazione', 'Equipamiento', 'Uitrusting', 'Wyposażenie', 'Utrustning', 'Recursos', '機能'],
  video:    ['Video', 'Video', 'Vidéo', 'Video', 'Vídeo', 'Video', 'Wideo', 'Video', 'Vídeo', '動画'],
  memory:   ['Memory', 'Speicher', 'Mémoire', 'Memoria', 'Memoria', 'Geheugen', 'Pamięć', 'Minne', 'Memória', 'メモリー'],
})
const L = (en, de, fr, it, es, nl, pl, sv, pt, ja) => [en, de, fr, it, es, nl, pl, sv, pt, ja]
Object.assign(LABELS, {
  camera_type:      L('Camera type', 'Kameratyp', "Type d'appareil", 'Tipo di fotocamera', 'Tipo de cámara', 'Cameratype', 'Typ aparatu', 'Kameratyp', 'Tipo de câmera', 'カメラタイプ'),
  megapixels:       L('Resolution', 'Auflösung', 'Résolution', 'Risoluzione', 'Resolución', 'Resolutie', 'Rozdzielczość', 'Upplösning', 'Resolução', '有効画素数'),
  sensor_type:      L('Sensor type', 'Sensortyp', 'Type de capteur', 'Tipo di sensore', 'Tipo de sensor', 'Sensortype', 'Typ matrycy', 'Sensortyp', 'Tipo de sensor', 'センサー種類'),
  sensor_format:    L('Sensor format', 'Sensorformat', 'Format du capteur', 'Formato sensore', 'Formato del sensor', 'Sensorformaat', 'Format matrycy', 'Sensorformat', 'Formato do sensor', 'センサーサイズ'),
  stabilizer:       L('Image stabilisation', 'Bildstabilisierung', "Stabilisation d'image", 'Stabilizzazione', 'Estabilizador de imagen', 'Beeldstabilisatie', 'Stabilizacja obrazu', 'Bildstabilisering', 'Estabilização de imagem', '手ブレ補正'),
  iso_max:          L('Max ISO', 'Max. ISO', 'ISO max', 'ISO max', 'ISO máx.', 'Max. ISO', 'Maks. ISO', 'Max ISO', 'ISO máx.', '最高ISO感度'),
  shutter_fastest:  L('Fastest shutter', 'Kürzeste Verschlusszeit', 'Vitesse max. obturateur', 'Otturatore più veloce', 'Obturación más rápida', 'Snelste sluitertijd', 'Najkrótszy czas migawki', 'Snabbaste slutartid', 'Obturador mais rápido', '最速シャッター速度'),
  video_resolution: L('Video resolution', 'Videoauflösung', 'Résolution vidéo', 'Risoluzione video', 'Resolución de vídeo', 'Videoresolutie', 'Rozdzielczość wideo', 'Videoupplösning', 'Resolução de vídeo', '動画解像度'),
  viewfinder:       L('Viewfinder', 'Sucher', 'Viseur', 'Mirino', 'Visor', 'Zoeker', 'Wizjer', 'Sökare', 'Visor', 'ファインダー'),
  flip_screen:      L('Vari-angle screen', 'Dreh-/Schwenkdisplay', 'Écran orientable', 'Display orientabile', 'Pantalla abatible', 'Kantelbaar scherm', 'Uchylny ekran', 'Vridbar skärm', 'Tela articulada', 'バリアングル液晶'),
  image_processor:  L('Image processor', 'Bildprozessor', "Processeur d'image", 'Processore immagine', 'Procesador de imagen', 'Beeldprocessor', 'Procesor obrazu', 'Bildprocessor', 'Processador de imagem', '画像処理エンジン'),
  projection_tech:  L('Projection technology', 'Projektionstechnik', 'Technologie de projection', 'Tecnologia di proiezione', 'Tecnología de proyección', 'Projectietechniek', 'Technologia projekcji', 'Projektionsteknik', 'Tecnologia de projeção', '投影方式'),
  brightness_lm:    L('Brightness', 'Helligkeit', 'Luminosité', 'Luminosità', 'Brillo', 'Helderheid', 'Jasność', 'Ljusstyrka', 'Brilho', '明るさ'),
  native_resolution:L('Native resolution', 'Native Auflösung', 'Résolution native', 'Risoluzione nativa', 'Resolución nativa', 'Native resolutie', 'Rozdzielczość natywna', 'Inbyggd upplösning', 'Resolução nativa', 'ネイティブ解像度'),
  light_source:     L('Light source', 'Lichtquelle', 'Source lumineuse', 'Sorgente luminosa', 'Fuente de luz', 'Lichtbron', 'Źródło światła', 'Ljuskälla', 'Fonte de luz', '光源'),
  light_life:       L('Light source life', 'Lebensdauer der Lichtquelle', 'Durée de vie de la source', 'Durata sorgente luminosa', 'Vida útil de la fuente', 'Levensduur lichtbron', 'Żywotność źródła światła', 'Ljuskällans livslängd', 'Vida útil da fonte de luz', '光源寿命'),
  throw_ratio:      L('Throw ratio', 'Projektionsverhältnis', 'Rapport de projection', 'Rapporto di proiezione', 'Relación de proyección', 'Projectieverhouding', 'Współczynnik projekcji', 'Kastförhållande', 'Razão de projeção', '投写比'),
  smart_projector:  L('Smart projector', 'Smart-Beamer', 'Projecteur connecté', 'Proiettore smart', 'Proyector inteligente', 'Slimme projector', 'Projektor smart', 'Smart projektor', 'Projetor inteligente', 'スマートプロジェクター'),
  noise:            L('Noise level', 'Geräuschpegel', 'Niveau sonore', 'Rumorosità', 'Nivel de ruido', 'Geluidsniveau', 'Poziom hałasu', 'Ljudnivå', 'Nível de ruído', '騒音レベル'),
  three_d:          L('3D', '3D', '3D', '3D', '3D', '3D', '3D', '3D', '3D', '3D'),
  gpu_chip:         L('Graphics processor', 'Grafikprozessor', 'Processeur graphique', 'Processore grafico', 'Procesador gráfico', 'Grafische processor', 'Procesor graficzny', 'Grafikprocessor', 'Processador gráfico', 'GPU'),
  gpu_brand:        L('GPU maker', 'GPU-Hersteller', 'Fabricant du GPU', 'Produttore GPU', 'Fabricante de GPU', 'GPU-fabrikant', 'Producent GPU', 'GPU-tillverkare', 'Fabricante da GPU', 'GPUメーカー'),
  vram:             L('Video memory', 'Grafikspeicher', 'Mémoire vidéo', 'Memoria video', 'Memoria de vídeo', 'Videogeheugen', 'Pamięć graficzna', 'Grafikminne', 'Memória de vídeo', 'ビデオメモリー'),
  vram_type:        L('Memory type', 'Speichertyp', 'Type de mémoire', 'Tipo di memoria', 'Tipo de memoria', 'Geheugentype', 'Typ pamięci', 'Minnestyp', 'Tipo de memória', 'メモリー種類'),
  memory_bus:       L('Memory bus', 'Speicherinterface', 'Bus mémoire', 'Bus di memoria', 'Bus de memoria', 'Geheugenbus', 'Szyna pamięci', 'Minnesbuss', 'Barramento de memória', 'メモリーバス'),
  gpu_clock:        L('GPU clock', 'GPU-Takt', 'Fréquence GPU', 'Frequenza GPU', 'Frecuencia de GPU', 'GPU-kloksnelheid', 'Taktowanie GPU', 'GPU-frekvens', 'Frequência da GPU', 'GPUクロック'),
  cuda_cores:       L('CUDA cores', 'CUDA-Kerne', 'Cœurs CUDA', 'Core CUDA', 'Núcleos CUDA', 'CUDA-cores', 'Rdzenie CUDA', 'CUDA-kärnor', 'Núcleos CUDA', 'CUDAコア'),
  interface:        L('Interface', 'Schnittstelle', 'Interface', 'Interfaccia', 'Interfaz', 'Interface', 'Interfejs', 'Gränssnitt', 'Interface', 'インターフェース'),
  directx:          L('DirectX', 'DirectX', 'DirectX', 'DirectX', 'DirectX', 'DirectX', 'DirectX', 'DirectX', 'DirectX', 'DirectX'),
  psu_min:          L('Recommended PSU', 'Empfohlenes Netzteil', 'Alimentation conseillée', 'Alimentatore consigliato', 'Fuente recomendada', 'Aanbevolen voeding', 'Zalecany zasilacz', 'Rekommenderat nätaggregat', 'Fonte recomendada', '推奨電源'),
  power_connectors: L('Power connectors', 'Stromanschlüsse', "Connecteurs d'alimentation", 'Connettori di alimentazione', 'Conectores de alimentación', 'Voedingsaansluitingen', 'Złącza zasilania', 'Strömkontakter', 'Conectores de energia', '補助電源'),
  card_length:      L('Card length', 'Kartenlänge', 'Longueur de la carte', 'Lunghezza scheda', 'Longitud de la tarjeta', 'Kaartlengte', 'Długość karty', 'Kortlängd', 'Comprimento da placa', 'カード長'),
  fans:             L('Fans', 'Lüfter', 'Ventilateurs', 'Ventole', 'Ventiladores', 'Ventilatoren', 'Wentylatory', 'Fläktar', 'Ventoinhas', 'ファン数'),
  max_displays:     L('Max displays', 'Max. Bildschirme', "Écrans max.", 'Schermi max', 'Pantallas máx.', 'Max. schermen', 'Maks. monitorów', 'Max skärmar', 'Telas máx.', '最大画面数'),
  platform:         L('Platform', 'Plattform', 'Plateforme', 'Piattaforma', 'Plataforma', 'Platform', 'Platforma', 'Plattform', 'Plataforma', 'プラットフォーム'),
  hdmi_out:         L('HDMI output', 'HDMI-Ausgang', 'Sortie HDMI', 'Uscita HDMI', 'Salida HDMI', 'HDMI-uitgang', 'Wyjście HDMI', 'HDMI-utgång', 'Saída HDMI', 'HDMI出力'),
  loading_type:     L('Loading type', 'Beladungsart', 'Type de chargement', 'Tipo di carica', 'Tipo de carga', 'Belading', 'Sposób załadunku', 'Laddningstyp', 'Tipo de carregamento', '投入方式'),
  capacity_kg:      L('Capacity', 'Fassungsvermögen', 'Capacité', 'Capacità', 'Capacidad', 'Inhoud', 'Pojemność', 'Kapacitet', 'Capacidade', '容量'),
  spin_speed:       L('Max spin speed', 'Max. Schleuderdrehzahl', 'Vitesse d’essorage max.', 'Velocità di centrifuga max', 'Centrifugado máx.', 'Max. centrifugesnelheid', 'Maks. prędkość wirowania', 'Max centrifugering', 'Centrifugação máx.', '最大脱水回転数'),
  energy_100:       L('Energy per 100 cycles', 'Energie pro 100 Zyklen', 'Énergie pour 100 cycles', 'Energia per 100 cicli', 'Energía por 100 ciclos', 'Energie per 100 cycli', 'Energia na 100 cykli', 'Energi per 100 cykler', 'Energia por 100 ciclos', '100回あたり消費電力量'),
  water_cycle:      L('Water per cycle', 'Wasser pro Zyklus', "Eau par cycle", 'Acqua per ciclo', 'Agua por ciclo', 'Water per cyclus', 'Woda na cykl', 'Vatten per cykel', 'Água por ciclo', '1回あたり水量'),
  inverter:         L('Inverter motor', 'Inverter-Motor', 'Moteur Inverter', 'Motore inverter', 'Motor Inverter', 'Invertermotor', 'Silnik inwerterowy', 'Invertermotor', 'Motor inverter', 'インバーター'),
  wifi_control:     L('App control (Wi-Fi)', 'App-Steuerung (WLAN)', 'Pilotage par appli (Wi-Fi)', 'Controllo da app (Wi-Fi)', 'Control por app (Wi-Fi)', 'App-bediening (wifi)', 'Sterowanie z aplikacji (Wi-Fi)', 'Appstyrning (Wi-Fi)', 'Controle por app (Wi-Fi)', 'アプリ操作（Wi-Fi）'),
  auto_dosing:      L('Automatic dosing', 'Automatische Dosierung', 'Dosage automatique', 'Dosaggio automatico', 'Dosificación automática', 'Automatische dosering', 'Automatyczne dozowanie', 'Automatisk dosering', 'Dosagem automática', '自動投入'),
  placement:        L('Installation', 'Bauart', 'Installation', 'Installazione', 'Instalación', 'Plaatsing', 'Montaż', 'Installation', 'Instalação', '設置タイプ'),
  drying_system:    L('Drying system', 'Trocknungsart', 'Système de séchage', 'Sistema di asciugatura', 'Sistema de secado', 'Droogsysteem', 'System suszenia', 'Torksystem', 'Sistema de secagem', '乾燥方式'),
  condensation_class:L('Condensation class', 'Kondensationseffizienzklasse', 'Classe de condensation', 'Classe di condensazione', 'Clase de condensación', 'Condensatieklasse', 'Klasa kondensacji', 'Kondensationsklass', 'Classe de condensação', '凝縮効率クラス'),
  cycle_time:       L('Programme duration', 'Programmdauer', 'Durée du programme', 'Durata programma', 'Duración del programa', 'Programmaduur', 'Czas programu', 'Programtid', 'Duração do programa', 'プログラム時間'),
  anti_crease:      L('Anti-crease', 'Knitterschutz', 'Anti-froissage', 'Antipiega', 'Antiarrugas', 'Kreukbescherming', 'Ochrona przed zagnieceniami', 'Skrynkelskydd', 'Antirrugas', 'シワ防止'),
  total_capacity:   L('Total capacity', 'Gesamtvolumen', 'Volume total', 'Capacità totale', 'Capacidad total', 'Totale inhoud', 'Pojemność całkowita', 'Total volym', 'Capacidade total', '総容量'),
  fridge_capacity:  L('Fridge capacity', 'Kühlteil', 'Volume réfrigérateur', 'Capacità frigo', 'Capacidad frigorífico', 'Inhoud koelkast', 'Pojemność chłodziarki', 'Kylvolym', 'Capacidade do refrigerador', '冷蔵室容量'),
  freezer_capacity: L('Freezer capacity', 'Gefrierteil', 'Volume congélateur', 'Capacità freezer', 'Capacidad congelador', 'Inhoud vriezer', 'Pojemność zamrażarki', 'Frysvolym', 'Capacidade do freezer', '冷凍室容量'),
  freezer_position: L('Freezer position', 'Position Gefrierteil', 'Position du congélateur', 'Posizione freezer', 'Posición del congelador', 'Positie vriezer', 'Położenie zamrażarki', 'Frysens placering', 'Posição do freezer', '冷凍室の位置'),
  no_frost:         L('No Frost', 'No Frost', 'No Frost', 'No Frost', 'No Frost', 'No Frost', 'No Frost', 'No Frost', 'Frost Free', 'ノンフロスト'),
  annual_energy:    L('Annual energy use', 'Jährlicher Energieverbrauch', 'Consommation annuelle', 'Consumo annuo', 'Consumo anual', 'Jaarlijks verbruik', 'Roczne zużycie energii', 'Årlig energiförbrukning', 'Consumo anual', '年間消費電力量'),
  climate_class:    L('Climate class', 'Klimaklasse', 'Classe climatique', 'Classe climatica', 'Clase climática', 'Klimaatklasse', 'Klasa klimatyczna', 'Klimatklass', 'Classe climática', '気候クラス'),
  icemaker:         L('Ice maker', 'Eiswürfelbereiter', 'Machine à glaçons', 'Fabbricatore di ghiaccio', 'Máquina de hielo', 'IJsblokjesmaker', 'Kostkarka', 'Ismaskin', 'Máquina de gelo', '製氷機'),
  coffee_type:      L('Machine type', 'Maschinentyp', 'Type de machine', 'Tipo di macchina', 'Tipo de cafetera', 'Type machine', 'Typ ekspresu', 'Maskintyp', 'Tipo de máquina', 'タイプ'),
  pressure:         L('Pump pressure', 'Pumpendruck', 'Pression de la pompe', 'Pressione pompa', 'Presión de la bomba', 'Pompdruk', 'Ciśnienie pompy', 'Pumptryck', 'Pressão da bomba', 'ポンプ圧'),
  grinder:          L('Built-in grinder', 'Integriertes Mahlwerk', 'Broyeur intégré', 'Macinacaffè integrato', 'Molinillo integrado', 'Ingebouwde molen', 'Wbudowany młynek', 'Inbyggd kvarn', 'Moedor embutido', 'グラインダー内蔵'),
  milk_frother:     L('Milk frother', 'Milchaufschäumer', 'Mousseur à lait', 'Montalatte', 'Espumador de leche', 'Melkopschuimer', 'Spieniacz do mleka', 'Mjölkskummare', 'Vaporizador de leite', 'ミルクフォーマー'),
  water_tank:       L('Water tank', 'Wassertank', "Réservoir d'eau", 'Serbatoio acqua', 'Depósito de agua', 'Waterreservoir', 'Zbiornik na wodę', 'Vattentank', 'Reservatório de água', '給水タンク'),
  bean_capacity:    L('Bean container', 'Bohnenbehälter', 'Réservoir à grains', 'Contenitore chicchi', 'Depósito de granos', 'Bonenreservoir', 'Pojemnik na ziarna', 'Bönbehållare', 'Reservatório de grãos', '豆ホッパー容量'),
  cups:             L('Cups at once', 'Tassen gleichzeitig', 'Tasses à la fois', 'Tazze contemporanee', 'Tazas a la vez', 'Kopjes tegelijk', 'Filiżanki naraz', 'Koppar samtidigt', 'Xícaras de uma vez', '同時抽出杯数'),
  power_w:          L('Power', 'Leistung', 'Puissance', 'Potenza', 'Potencia', 'Vermogen', 'Moc', 'Effekt', 'Potência', '消費電力'),
  built_in_display: L('Display', 'Display', 'Écran', 'Display', 'Pantalla', 'Display', 'Wyświetlacz', 'Display', 'Visor', 'ディスプレイ'),
})

const res2 = (f) => { const m = /(\d+)\s*x\s*(\d+)/i.exec(f?.raw ?? ''); return m ? `${m[1]} × ${m[2]}` : txt(f) }
C.res2 = res2

Object.assign(CATEGORIES, {
  cameras: {
    catid: '575', sort: 120, min: 8, codeAsName: false,
    i18n: { en: ['cameras', 'Cameras'], de: ['kameras', 'Kameras'], fr: ['appareils-photo', 'Appareils photo'], it: ['fotocamere', 'Fotocamere'], es: ['camaras', 'Cámaras'], nl: ['cameras', 'Camera’s'], pl: ['aparaty', 'Aparaty'], sv: ['kameror', 'Kameror'], 'pt-br': ['cameras', 'Câmeras'], ja: ['cameras', 'カメラ'] },
    specs: [
      s('camera_type', 'camera', 'text', null, null, true, true, [8053, /^camera type$/i]),
      s('megapixels', 'camera', 'number', 'MP', true, true, true, [63, /^megapixel \(approx\.\)$/i]),
      s('sensor_type', 'camera', 'text', null, null, false, false, [1574, /^sensor type$/i]),
      s('sensor_format', 'camera', 'text', null, null, true, true, [16204, /^sensor format$/i]),
      s('stabilizer', 'camera', 'bool', null, true, false, true, [1578, /^image stabilizer$/i]),
      s('iso_max', 'camera', 'number', null, true, false, false, [9161, /^ISO sensitivity \(max\)$/i]),
      s('shutter_fastest', 'camera', 'text', null, null, false, false, [9158, /^fastest camera shutter speed$/i]),
      s('image_processor', 'camera', 'text', null, null, false, false, [8059, /^image processor$/i]),
      s('video_resolution', 'video', 'text', null, null, true, true, [[11424, /^HD type$/i], [7514, /^maximum video resolution$/i]]),
      s('viewfinder', 'display', 'text', null, null, false, true, [1293, /^viewfinder type$/i]),
      s('touchscreen', 'display', 'bool', null, true, false, false, [4963, /^touchscreen$/i]),
      s('flip_screen', 'display', 'bool', null, true, false, true, [6691, /^vari-angle LCD display$/i]),
      s('wifi_support', 'connectivity', 'bool', null, true, false, false, [3239, /^wi-fi$/i]),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('usb', 'connectivity', 'text', null, null, false, false, 'usb'),
      s('weight', 'body', 'number', 'g', false, true, false, [[7418, /^weight \(including battery\)$/i], [94, /^weight$/i]]),
    ],
  },
  projectors: {
    catid: '567', sort: 130, min: 8, codeAsName: true,
    i18n: { en: ['projectors', 'Projectors'], de: ['beamer', 'Beamer'], fr: ['videoprojecteurs', 'Vidéoprojecteurs'], it: ['proiettori', 'Proiettori'], es: ['proyectores', 'Proyectores'], nl: ['beamers', 'Beamers'], pl: ['projektory', 'Projektory'], sv: ['projektorer', 'Projektorer'], 'pt-br': ['projetores', 'Projetores'], ja: ['projectors', 'プロジェクター'] },
    specs: [
      s('brightness_lm', 'picture', 'number', 'lm', true, true, true, [1181, /^projector brightness$/i]),
      s('native_resolution', 'picture', 'text', null, null, true, true, [11807, /^projector native resolution$/i]),
      s('projection_tech', 'picture', 'text', null, null, true, true, [1179, /^projection technology$/i]),
      s('light_source', 'picture', 'text', null, null, false, true, [40499, /^light source type$/i]),
      s('light_life', 'picture', 'number', 'h', true, false, false, [40501, /^service life of light source$/i]),
      s('throw_ratio', 'picture', 'text', null, null, false, false, [1825, /^throw ratio$/i]),
      s('three_d', 'picture', 'bool', null, true, false, false, [7599, /^3D$/]),
      s('smart_projector', 'smart', 'bool', null, true, false, true, [43840, /^smart projector$/i]),
      s('os', 'smart', 'text', null, null, false, false, [3233, /^operating system installed$/i]),
      s('noise', 'audio', 'number', 'dB', false, false, false, [1793, /^noise level$/i]),
      s('speaker_power', 'audio', 'number', 'W', true, false, false, [1854, /^RMS rated power$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('power_typical', 'energy', 'number', 'W', false, false, false, [445, /^power consumption \(typical\)$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, false, false, [94, /^weight$/i], 'kg'),
    ],
  },
  'graphics-cards': {
    catid: '170', sort: 70, min: 8, codeAsName: true,
    i18n: { en: ['graphics-cards', 'Graphics cards'], de: ['grafikkarten', 'Grafikkarten'], fr: ['cartes-graphiques', 'Cartes graphiques'], it: ['schede-video', 'Schede video'], es: ['tarjetas-graficas', 'Tarjetas gráficas'], nl: ['videokaarten', 'Videokaarten'], pl: ['karty-graficzne', 'Karty graficzne'], sv: ['grafikkort', 'Grafikkort'], 'pt-br': ['placas-de-video', 'Placas de vídeo'], ja: ['graphics-cards', 'グラフィックボード'] },
    specs: [
      s('gpu_chip', 'performance', 'text', null, null, true, true, [1654, /^graphics processor$/i]),
      s('gpu_brand', 'performance', 'text', null, null, false, true, [9787, /^graphics processor family$/i]),
      s('vram', 'memory', 'number', 'GB', true, true, true, [18403, /^discrete graphics card memory$/i], 'gb'),
      s('vram_type', 'memory', 'text', null, null, false, true, [958, /^graphics card memory type$/i]),
      s('memory_bus', 'memory', 'number', 'bit', true, false, false, [1630, /^memory bus$/i]),
      s('gpu_clock', 'performance', 'number', 'MHz', true, true, false, [5, /^processor frequency$/i]),
      s('cuda_cores', 'performance', 'number', null, true, false, false, [7991, /^CUDA cores$/i]),
      s('interface', 'ports', 'text', null, null, false, false, [990, /^interface type$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('displayport', 'ports', 'text', null, null, false, false, [11111, /^DisplayPort version$/i]),
      s('max_displays', 'ports', 'number', null, true, false, false, [6554, /^maximum displays per videocard$/i]),
      s('directx', 'performance', 'text', null, null, false, false, [2927, /^DirectX version$/i]),
      s('psu_min', 'energy', 'number', 'W', false, false, true, [3462, /^minimum system power supply$/i]),
      s('power_connectors', 'energy', 'text', null, null, false, false, [7992, /^supplementary power connectors$/i]),
      s('fans', 'body', 'number', null, null, false, false, [4539, /^number of fans$/i]),
      s('card_length', 'body', 'number', 'mm', false, false, true, [2738, /^length$/i]),
    ],
  },
  'game-consoles': {
    catid: ['2837', '1060'], // портативные + домашние консоли sort: 100, min: 6, codeAsName: false,
    i18n: { en: ['game-consoles', 'Game consoles'], de: ['spielkonsolen', 'Spielkonsolen'], fr: ['consoles', 'Consoles de jeux'], it: ['console', 'Console'], es: ['consolas', 'Consolas'], nl: ['spelcomputers', 'Spelcomputers'], pl: ['konsole', 'Konsole'], sv: ['spelkonsoler', 'Spelkonsoler'], 'pt-br': ['consoles', 'Consoles'], ja: ['game-consoles', 'ゲーム機'] },
    specs: [
      s('platform', 'performance', 'text', null, null, true, true, [75, /^platform$/i]),
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_type', 'display', 'text', null, null, false, true, [83, /^display$/i]),
      s('display_resolution', 'display', 'text', null, null, false, false, [1585, /^display resolution$/i], 'res'),
      s('storage', 'performance', 'number', 'GB', true, true, true, [[5150, /^built-in memory capacity$/i], [3318, /^total storage capacity$/i]], 'gb'),
      s('expandable_storage', 'performance', 'bool', null, true, false, false, 'expandable'),
      s('battery_life', 'battery', 'number', 'h', true, false, true, [1721, /^battery life \(max\)$/i], 'hours'),
      s('battery', 'battery', 'number', 'mAh', true, false, false, [909, /^battery capacity$/i]),
      s('hdmi_out', 'ports', 'bool', null, true, false, false, [5620, /^HDMI$/]),
      s('wifi_support', 'connectivity', 'bool', null, true, false, false, [3239, /^wi-fi$/i]),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('weight', 'body', 'number', 'g', false, false, false, [94, /^weight$/i]),
    ],
  },
  'washing-machines': {
    catid: '1331', sort: 140, min: 8, codeAsName: true,
    i18n: { en: ['washing-machines', 'Washing machines'], de: ['waschmaschinen', 'Waschmaschinen'], fr: ['lave-linge', 'Lave-linge'], it: ['lavatrici', 'Lavatrici'], es: ['lavadoras', 'Lavadoras'], nl: ['wasmachines', 'Wasmachines'], pl: ['pralki', 'Pralki'], sv: ['tvattmaskiner', 'Tvättmaskiner'], 'pt-br': ['maquinas-de-lavar', 'Máquinas de lavar'], ja: ['washing-machines', '洗濯機'] },
    specs: [
      s('capacity_kg', 'capacity', 'number', 'kg', true, true, true, [2492, /^rated capacity$/i]),
      s('loading_type', 'capacity', 'text', null, null, false, true, [2486, /^loading type$/i]),
      s('spin_speed', 'features', 'number', 'rpm', true, true, true, [8260, /^maximum spin speed$/i]),
      s('energy_class', 'energy', 'text', null, null, true, true, [2705, /^energy efficiency class$/i]),
      s('energy_100', 'energy', 'number', 'kWh', false, false, false, [42849, /^energy consumption per 100 cycles$/i]),
      s('water_cycle', 'energy', 'number', 'L', false, false, false, [2510, /^water consumption per cycle$/i]),
      s('noise', 'features', 'number', 'dB', false, false, false, [[7619, /^noise level \(spin\)$/i], [1793, /^noise level$/i]]),
      s('inverter', 'features', 'bool', null, true, false, true, [2598, /^inverter technology$/i]),
      s('wifi_control', 'features', 'bool', null, true, false, true, [18198, /^wi-fi controlled$/i]),
      s('auto_dosing', 'features', 'bool', null, true, false, true, [33230, /^automatic dosing system$/i]),
      s('placement', 'body', 'text', null, null, false, true, [39815, /^appliance placement$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, false, false, [94, /^weight$/i], 'kg'),
    ],
  },
  'tumble-dryers': {
    catid: '1330', sort: 150, min: 8, codeAsName: true,
    i18n: { en: ['tumble-dryers', 'Tumble dryers'], de: ['waeschetrockner', 'Wäschetrockner'], fr: ['seche-linge', 'Sèche-linge'], it: ['asciugatrici', 'Asciugatrici'], es: ['secadoras', 'Secadoras'], nl: ['wasdrogers', 'Wasdrogers'], pl: ['suszarki', 'Suszarki do ubrań'], sv: ['torktumlare', 'Torktumlare'], 'pt-br': ['secadoras', 'Secadoras'], ja: ['tumble-dryers', '衣類乾燥機'] },
    specs: [
      s('capacity_kg', 'capacity', 'number', 'kg', true, true, true, [2492, /^rated capacity$/i]),
      s('drying_system', 'features', 'text', null, null, true, true, [2622, /^drying system$/i]),
      s('energy_class', 'energy', 'text', null, null, true, true, [2705, /^energy efficiency class$/i]),
      s('energy_100', 'energy', 'number', 'kWh', false, false, false, [42849, /^energy consumption per 100 cycles$/i]),
      s('condensation_class', 'energy', 'text', null, null, false, false, [39283, /^condensation efficiency class$/i]),
      s('cycle_time', 'features', 'number', 'min', false, false, false, [2509, /^cycle time$/i]),
      s('noise', 'features', 'number', 'dB', false, false, false, [1793, /^noise level$/i]),
      s('anti_crease', 'features', 'bool', null, true, false, false, [6974, /^anti-crease function$/i]),
      s('wifi_control', 'features', 'bool', null, true, false, true, [18198, /^wi-fi controlled$/i]),
      s('placement', 'body', 'text', null, null, false, true, [39815, /^appliance placement$/i]),
      s('loading_type', 'body', 'text', null, null, false, false, [2486, /^loading type$/i]),
    ],
  },
  fridges: {
    catid: ['1873', '1911', '1912'], // холодильники с морозилкой: обычные, комби, Side-by-Side sort: 160, min: 8, codeAsName: true,
    i18n: { en: ['fridges', 'Fridge freezers'], de: ['kuehl-gefrierkombinationen', 'Kühl-Gefrierkombinationen'], fr: ['refrigerateurs-congelateurs', 'Réfrigérateurs-congélateurs'], it: ['frigoriferi-combinati', 'Frigoriferi combinati'], es: ['frigorificos-combi', 'Frigoríficos combi'], nl: ['koel-vriescombinaties', 'Koel-vriescombinaties'], pl: ['lodowki', 'Lodówki z zamrażarką'], sv: ['kyl-frys', 'Kyl-frys'], 'pt-br': ['geladeiras', 'Geladeiras'], ja: ['fridges', '冷蔵庫'] },
    specs: [
      s('total_capacity', 'capacity', 'number', 'L', true, true, true, [2475, /^total gross capacity$|^total net capacity$/i]),
      s('fridge_capacity', 'capacity', 'number', 'L', true, false, false, [2479, /^fridge (gross|net) capacity$/i]),
      s('freezer_capacity', 'capacity', 'number', 'L', true, false, false, [2477, /^freezer (gross|net) capacity$/i]),
      s('freezer_position', 'capacity', 'text', null, null, false, true, [8251, /^freezer position$/i]),
      s('no_frost', 'features', 'bool', null, true, true, true, [16946, /^no frost \(fridge\)$/i]),
      s('energy_class', 'energy', 'text', null, null, true, true, [2705, /^energy efficiency class$/i]),
      s('annual_energy', 'energy', 'number', 'kWh', false, false, false, [8422, /^annual energy consumption$/i]),
      s('noise', 'features', 'number', 'dB', false, false, false, [1793, /^noise level$/i]),
      s('climate_class', 'features', 'text', null, null, false, false, [2471, /^climate class$/i]),
      s('icemaker', 'features', 'bool', null, true, false, false, [7317, /^icemaker$/i]),
      s('inverter', 'features', 'bool', null, true, false, false, [2598, /^inverter technology$/i]),
      s('wifi_support', 'features', 'bool', null, true, false, true, [3239, /^wi-fi$/i]),
      s('placement', 'body', 'text', null, null, false, true, [39815, /^appliance placement$/i]),
    ],
  },
  'coffee-machines': {
    catid: '1320', sort: 170, min: 7, codeAsName: false,
    i18n: { en: ['coffee-machines', 'Coffee machines'], de: ['kaffeemaschinen', 'Kaffeemaschinen'], fr: ['machines-a-cafe', 'Machines à café'], it: ['macchine-da-caffe', 'Macchine da caffè'], es: ['cafeteras', 'Cafeteras'], nl: ['koffiemachines', 'Koffiemachines'], pl: ['ekspresy-do-kawy', 'Ekspresy do kawy'], sv: ['kaffemaskiner', 'Kaffemaskiner'], 'pt-br': ['cafeteiras', 'Cafeteiras'], ja: ['coffee-machines', 'コーヒーメーカー'] },
    specs: [
      s('coffee_type', 'features', 'text', null, null, true, true, [13613, /^coffee maker type$/i]),
      s('pressure', 'features', 'number', 'bar', true, true, false, [5221, /^maximum operating pressure$/i]),
      s('grinder', 'features', 'bool', null, true, true, true, [7569, /^built-in grinder$/i]),
      s('milk_frother', 'features', 'bool', null, true, false, true, [17529, /^built-in milk frother$/i]),
      s('cups', 'features', 'number', null, true, false, false, [2515, /^capacity in cups$/i]),
      s('water_tank', 'capacity', 'number', 'L', true, false, false, [2537, /^water tank capacity$/i]),
      s('bean_capacity', 'capacity', 'number', 'g', true, false, false, [2896, /^coffee beans capacity$/i]),
      s('built_in_display', 'features', 'bool', null, true, false, false, [8782, /^built-in display$/i]),
      s('wifi_support', 'features', 'bool', null, true, false, true, [3239, /^wi-fi$/i]),
      s('power_w', 'energy', 'number', 'W', null, false, false, [4098, /^power$/i]),
      s('energy_class', 'energy', 'text', null, null, false, false, [2705, /^energy efficiency class$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, false, false, [94, /^weight$/i], 'kg'),
    ],
  },
})

function pickFeature(fs, p) {
  const [id, re] = p
  return fs.find((f) => id != null && f.id === id) ?? fs.find((f) => re.test(f.name)) ?? null
}

/** Карточка Icecat → { key: value } по описанию категории. */
export function mapByConfig(cfg, data) {
  const fs = flatFeatures(data)
  const g = (p) => pickFeature(fs, p)
  const out = {}
  for (const sp of cfg.specs) {
    let v = null
    if (typeof sp.pick === 'string') v = SPECIAL[sp.pick](g)
    else {
      const list = Array.isArray(sp.pick[0]) ? sp.pick : [sp.pick]
      for (const p of list) { v = C[sp.conv](g(p)); if (v != null) break }
    }
    if (sp.key === 'lte' && v != null) v = v === true // «Mobile network connection» Y → есть LTE
    out[sp.key] = v
  }
  return out
}

/** Автокатегория: характеристики с ключом f<ID признака Icecat>, тип — из базы. */
export function mapAuto(defs, data) {
  const byId = new Map(flatFeatures(data).map((f) => [f.id, f]))
  const out = {}
  for (const d of defs) {
    if (!/^f\d+$/.test(d.key)) continue
    const f = byId.get(Number(d.key.slice(1)))
    out[d.key] = d.data_type === 'number' ? num(f) : d.data_type === 'bool' ? yn(f) : txt(f)
  }
  return out
}
