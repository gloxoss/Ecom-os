const beano = (file: string) => `/assets/beano/${file}`;
const angelina = (file: string) => `/assets/angelina/${file}`;

export const landingContent = {
  hero: {
    title: "Angelina, the Parisian ritual.",
    description: "Signature hot chocolate, delicate pastries, and giftable sweets shaped by the elegance of the salon de the.",
    image: {
      src: angelina("hero-hot-chocolate-macro-texture.webp"),
      alt: "Abstract macro texture of hot chocolate and cream with glossy bubbles",
    },
    categories: [
      { id: "hot-chocolate", label: "Hot chocolate", href: "/menu" },
      { id: "mont-blanc", label: "Mont-Blanc", href: "/menu" },
      { id: "macarons", label: "Macarons", href: "/catalog" },
      { id: "tea", label: "Tea", href: "/catalog" },
      { id: "chocolates", label: "Chocolates", href: "/catalog" },
      { id: "gifts", label: "Gift boxes", href: "/catalog" },
    ],
    cta: {
      label: "Shop signatures",
      href: "/catalog",
    },
  },

  collection: {
    label: "Maison collection",
    tabs: [
      { id: "all", label: "All signatures" },
      { id: "decaf", label: "Hot chocolate" },
      { id: "filter", label: "Confectionery" },
      { id: "espresso", label: "Tea" },
      { id: "cold-brew", label: "Patisserie" },
      { id: "single-origin", label: "Gourmet spreads" },
      { id: "signature", label: "Gift sets" },
    ],
    cta: { label: "All products", href: "/catalog" },
  },

  featureBlocks: [
    {
      label: "Inside the Maison",
      title: "We compose each detail around generous patisserie, refined gifting, and the pleasure of a Paris tea-room pause.",
      cta: { label: "Learn more about process", href: "#section-process" },
      image: {
        src: angelina("feature-boutique-shelf.webp"),
        alt: "Elegant patisserie boutique shelves with tea tins and confectionery boxes",
      },
    },
    {
      label: "Patisserie worth exploring",
      title: "A curated selection of sweets, teas, chocolates, and signatures for elegant everyday indulgence.",
      cta: { label: "View our collection", href: "/catalog" },
      image: {
        src: angelina("feature-macaron-gift.webp"),
        alt: "Macaron gift box with roses and ribbon on a soft blush surface",
      },
    },
  ],

  story: {
    label: "Our story",
    title: "Our story begins with the Paris salon: a place for hot chocolate, pastry, and quiet celebration.",
    video: {
      mp4: "",
      webm: "",
      poster: angelina("story-salon-interior-pan-poster.webp"),
      alt: "Elegant Belle Epoque tea room with marble tables and warm leather chairs",
    },
    paragraphs: [
      "Angelina-inspired moments are built from simple luxuries: porcelain, cream, chocolate, pastry, and warm salon light.",
      "The experience is less about rushing through dessert and more about letting a small ritual feel beautifully complete.",
    ],
    cta: { label: "Learn more", href: "/about-us" },
    values: [
      { number: "01", title: "Quality" },
      { number: "02", title: "Elegance" },
      { number: "03", title: "Ritual" },
      { number: "04", title: "Gifting" },
    ],
  },

  process: {
    label: "Our craft",
    title: "Our craft is guided by texture, patience, and the pleasure of a precise finish.",
    description:
      "From piped chestnut cream to glossy hot chocolate, each signature is shaped to feel generous, polished, and unmistakably Parisian.",
    image: {
      src: angelina("process-piping-mont-blanc.webp"),
      alt: "Pastry chef piping chestnut cream onto a Mont-Blanc pastry",
    },
    steps: [
      {
        number: "01",
        title: "Compose",
        text: "We begin with a clear ritual: chocolate, cream, pastry, porcelain, and warm salon atmosphere.",
      },
      {
        number: "02",
        title: "Craft",
        text: "Each element is shaped with care, from fine chestnut strands to clean gifting details.",
      },
      {
        number: "03",
        title: "Serve",
        text: "The final moment should feel calm, refined, and ready to linger at the table.",
      },
    ],
  },

  quote: {
    label: "A note from the Maison",
    text: "\"Every detail is composed for the same ritual: a generous pastry, a cup of hot chocolate, and a Paris moment made to linger.\"",
    author: {
      name: "Maison Angelina",
      role: "Parisian salon de the",
      image: {
        src: angelina("quote-author-maison-detail.webp"),
        alt: "Elegant tea-room detail with porcelain, gold, and soft salon light",
      },
    },
    image: {
      src: angelina("quote-maison-still-life.webp"),
      alt: "Porcelain hot chocolate cup, rose, and blank menu on a marble tea-room table",
    },
  },

  brew: {
    label: "Our hot chocolate",
    title: "Our signature ritual is made for those who love depth, creaminess, and quiet indulgence.",
    description:
      "A rich cup of hot chocolate, a delicate Mont-Blanc, and the soft pause of a Paris tea room - served with care and intention.",
    cta: { label: "View signatures", href: "/menu" },
    features: [
      {
        icon: beano("aHR0cHM6_697881b1d479d8e7dc13db98_Frame (2).svg"),
        title: "Velvety chocolate",
        text: "A dense, glossy cup with deep cocoa notes and a soft, comforting finish.",
      },
      {
        icon: beano("aHR0cHM6_69788224587f64b9bbb001a3_Frame (3).svg"),
        title: "Tea-room ritual",
        text: "A refined pairing of pastry, cream, porcelain, and warm salon atmosphere.",
      },
    ],
    images: [
      { src: angelina("brew-hot-chocolate-cup-cutout-transparent.webp"), alt: "White porcelain cup filled with thick hot chocolate" },
      { src: angelina("brew-mont-blanc-cutout-transparent.webp"), alt: "Isolated Mont-Blanc pastry on a white porcelain plate" },
    ],
  },

  reviews: {
    label: "What our clients say",
    image: {
      src: angelina("reviews-salon-table.webp"),
      alt: "Two cups of hot chocolate and pastries on a marble salon table",
    },
    items: [
      {
        quote: "\"The hot chocolate feels like a little Paris ceremony. Rich, elegant, and impossible to rush.\"",
        author: "Sophia Bennett",
        rating: 5,
      },
      {
        quote: "\"The Mont-Blanc was delicate and generous at once. Exactly the kind of dessert you remember.\"",
        author: "Michael Turner",
        rating: 5,
      },
      {
        quote: "\"Beautiful pastries, polished service, and a tea-room mood that feels calm and special.\"",
        author: "Daniel Brooks",
        rating: 5,
      },
      {
        quote: "\"The gift boxes looked refined before they were even opened. A perfect patisserie moment.\"",
        author: "Daniel Foster",
        rating: 5,
      },
    ],
  },

  location: {
    label: "Ready to visit Angelina",
    title: "Explore signature pastries, hot chocolate, and giftable sweets inspired by the Paris salon tradition.",
    cta: { label: "Explore the menu", href: "/menu" },
    video: {
      mp4: "",
      webm: "",
      poster: angelina("location-tea-room-pan-poster.webp"),
      alt: "Wide view of an elegant Paris patisserie tea room",
    },
    address: {
      label: "Our location",
      value: "226 Rue de Rivoli, 75001 Paris, France",
      mapUrl: "https://www.google.com/maps/search/Angelina+Paris+226+Rue+de+Rivoli+75001+Paris",
      mapCta: "View in map",
    },
  },
};
