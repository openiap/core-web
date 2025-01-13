export class Resource {
    constructor() {
        this._type = "resource";
    }
    _type: string;
    _id: string = "";
    name: string = "";
    target: ResourceTargetType = ResourceTargetType.customer;
    customerassign: ResourceVariantType = ResourceVariantType.single;
    workspaceassign: ResourceVariantType = ResourceVariantType.single;
    userassign: ResourceVariantType = ResourceVariantType.single;
    memberassign: ResourceVariantType = ResourceVariantType.single;
    defaultmetadata: any = {};
    products: Product[] = [];
    allowdirectassign: boolean = false;
    order: number = 0;
    key: number = $state(0);
}
export class Product {
    name: string = "";
    stripeproduct: string = "";
    stripeprice: string = "";
    customerassign: ResourceAssignedType = ResourceAssignedType.single;
    workspaceassign: ResourceAssignedType = ResourceAssignedType.single;
    userassign: ResourceAssignedType = ResourceAssignedType.single;
    memberassign: ResourceAssignedType = ResourceAssignedType.single;
    added_stripeprice: string = "";
    added_resourceid: string = "";
    added_quantity_multiplier: number = 0;
    metadata: any = {};
    allowdirectassign: boolean = false;
    order: number = 0;
    key: number = $state(0);
}
export class ResourceUsage {
    constructor() {
        this._type = "resourceusage";
    }
    name: string = "";
    _type: string;
    _id: string = "";
    product: Product = null as any;
    resourceid: string = "";
    resource: string = "";
    userid: string = "";
    memberid: string = "";
    customerid: string = "";
    workspaceid: string = "";
    quantity: number = 0;
    /** "subscription" */
    subid: string = "";
    "subscription": any = {};
    /** "subscription_item" */
    siid: string = "";
    key: number = $state(0);
}
export declare enum ResourceTargetType {
    customer = "customer",
    workspace = "workspace",
    user = "user",
    member = "member",
}
export declare enum ResourceVariantType {
    single = "singlevariant",
    multiple = "multiplevariants"
}
export declare enum ResourceAssignedType {
    single = "single",
    multiple = "multiple",
    metered = "metered",
}