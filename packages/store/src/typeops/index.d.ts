declare type TypeOpEntity = ({
    id: string;
} | {
    _id: string;
})[] | undefined | null;
export declare type AppendToList<T extends TypeOpEntity> = {};
export declare type PrependToList<T extends TypeOpEntity> = {};
export declare type UpdateList<T extends TypeOpEntity> = {};
export declare type DeleteFromList<T extends TypeOpEntity> = {};
export declare type AppendToListAndDiscard<T extends TypeOpEntity> = {};
export declare type PrependToListAndDiscard<T extends TypeOpEntity> = {};
export declare type UpdateListAndDiscard<T extends TypeOpEntity> = {};
export declare type DeleteFromListAndDiscard<T extends TypeOpEntity> = {};
export declare type PaginateAppend<T extends TypeOpEntity = null> = {};
export declare type PaginatePrepend<T extends TypeOpEntity = null> = {};
export declare type TypeOpsType = "AppendToList" | "PrependToList" | "UpdateList" | "DeleteFromList" | "AppendToListAndDiscard" | "PrependToListAndDiscard" | "UpdateListAndDiscard" | "DeleteFromListAndDiscard" | "PaginateAppend" | "PaginatePrepend";
export {};
//# sourceMappingURL=index.d.ts.map