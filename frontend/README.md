# Gel/Gid – Sprint 1 (React + Tailwind + Vite + TS)

Mobil odaklı ana sayfa + alt bar + 30sn’de yenilenen kur kartı + FAB menüsü (placeholder) iskeleti.

## Kurulum

```bash
# 1) Bağımlılıkları kur
npm install

# 2) Geliştirme sunucusunu başlat
npm run dev

# 3) Tarayıcıda aç (Vite çıktısında verilen URL), genelde:
# http://localhost:5173
```

> Not: Bu sürüm **auth’suzdur** ve gelir/gider verileri/mock kurlarla çalışır.
> Sprint 2’de CRUD ve gerçek kur servisi eklenecek.

## Neler Var?
- React 18 + TypeScript
- Tailwind CSS (3.x)
- Vite 5
- lucide-react ikonları
- Mobil-first layout, alt gezinme, FAB menüsü

## Dizin Yapısı
```
.
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    └── vite-env.d.ts
```

## Sonraki Adımlar (öneri)
- `/incomes` ve `/expenses` rotalarını işlevsel hale getirmek
- “Manuel Gider Ekle” formu ve listeleme/silme
- Kur servisinin backend proxy ile bağlanması (30sn cache)
- Auth (Google/Apple) ve kalıcı session
