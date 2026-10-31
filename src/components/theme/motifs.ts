// src/components/theme/motifs.ts
// 20 motifs dorés découpés — chaque PNG = 1 calque sélectionnable.

export interface Motif {
  id: string;
  name: string;
  source: any;
}

export const MOTIFS: Motif[] = [
  {
    id: "m01",
    name: "Coin fleuri",
    source: require("../../../assets/images/motifs/m01.png"),
  },
  {
    id: "m02",
    name: "Couronne",
    source: require("../../../assets/images/motifs/m02.png"),
  },
  {
    id: "m03",
    name: "Laurier",
    source: require("../../../assets/images/motifs/m03.png"),
  },
  {
    id: "m04",
    name: "Arabesque",
    source: require("../../../assets/images/motifs/m04.png"),
  },
  {
    id: "m05",
    name: "Losange",
    source: require("../../../assets/images/motifs/m05.png"),
  },
  {
    id: "m06",
    name: "Flèche",
    source: require("../../../assets/images/motifs/m06.png"),
  },
  {
    id: "m07",
    name: "Arabesque large",
    source: require("../../../assets/images/motifs/m07.png"),
  },
  {
    id: "m08",
    name: "Épi",
    source: require("../../../assets/images/motifs/m08.png"),
  },
  {
    id: "m09",
    name: "Étoile",
    source: require("../../../assets/images/motifs/m09.png"),
  },
  {
    id: "m10",
    name: "Boucle",
    source: require("../../../assets/images/motifs/m10.png"),
  },
  {
    id: "m11",
    name: "Fleur",
    source: require("../../../assets/images/motifs/m11.png"),
  },
  {
    id: "m12",
    name: "Point",
    source: require("../../../assets/images/motifs/m12.png"),
  },
  {
    id: "m13",
    name: "Double boucle",
    source: require("../../../assets/images/motifs/m13.png"),
  },
  {
    id: "m14",
    name: "Ondulation",
    source: require("../../../assets/images/motifs/m14.png"),
  },
  {
    id: "m15",
    name: "Arabesque bas",
    source: require("../../../assets/images/motifs/m15.png"),
  },
  {
    id: "m16",
    name: "Losange creux",
    source: require("../../../assets/images/motifs/m16.png"),
  },
  {
    id: "m17",
    name: "Volutes cœur",
    source: require("../../../assets/images/motifs/m17.png"),
  },
  {
    id: "m18",
    name: "Rond central",
    source: require("../../../assets/images/motifs/m18.png"),
  },
  {
    id: "m19",
    name: "Cadre côté",
    source: require("../../../assets/images/motifs/m19.png"),
  },
  {
    id: "m20",
    name: "Coin bas-droit",
    source: require("../../../assets/images/motifs/m20.png"),
  },
];
