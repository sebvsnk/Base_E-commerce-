export type Product = {
  id: string;
  name: string;
  price: number; // CLP u otra moneda
  image: string;
  description: string;
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Polera Noir",
    price: 12990,
    image: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS22SM6P8q2Nukug9QvuLNI7NUEFNtBfgOm25YGiNEZZgvQBHB3Bm6fQxtvAuGJSOdYEiM0X9zaKhnKFmCB9o9kLca2-L7htfPXyi6AM-ZrG2oihH3rudrs_NiuFoX1_h9NtQKjhg&usqp=CAc",
    description: "Polera cómoda, buen fit, ideal para diario.",
  },
  {
    id: "p2",
    name: "Audífonos Studio",
    price: 39990,
    image: "https://cl-cenco-pim-resizer.ecomm.cencosud.com/unsafe/adaptive-fit-in/3840x0/filters:quality(75)/prd-cl/product-medias/84befcdc-7bc6-4667-8e43-f01ebe15c608/MKMNVJI72E/MKMNVJI72E-1/1713991178040-MKMNVJI72E-1-0.jpg",
    description: "Sonido balanceado, bajos firmes, livianos.",
  },
  {
    id: "p3",
    name: "Mouse Gamer",
    price: 19990,
    image: "https://www.weplay.cl/pub/media/catalog/product/cache/3135f28587838cb58c30c8a955a56da9/4/5/4583223487651-1.jpg",
    description: "Sensor preciso, clicks firmes y buen agarre.",
  },
  {
    id: "p4",
    name: "Teclado Mecánico",
    price: 54990,
    image: "https://www.winpy.cl/files/38427-8947-Razer-Huntsman-Mini-1.jpg",
    description: "Mecánico, rápido, perfecto para escribir y jugar.",
  },
];
