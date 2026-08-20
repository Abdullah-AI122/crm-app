import { COLLECTION_COLOR_PALETTE } from "@/data/data";

interface Collection {
    _id: string;
    name: string;
    color: string;
    position: number;
}

export default function getCollectionColor(
    collection: Collection,
    index: number
) {
    if (collection.color) {
        return collection.color;
    }

    return COLLECTION_COLOR_PALETTE[
        index % COLLECTION_COLOR_PALETTE.length
    ];
}
