export const MenuItemTemplate = {
    name: 'A',
    nameAr: 'B',
    description: 'C',
    descriptionAr: 'D',
    categoryId: 'E',
    price: 'F'
};
export const MaterialTemplate = {
    name: 'A',
    nameAr: 'B',
    description: 'C',
    descriptionAr: 'D',
    uomBase: 'E',
    uomPurchase: 'F'
}

export const PurchaseTemplate = {
    postedDate: 'A',
    referenceNumber: 'B',
    vendorId: 'C',
    paymentType: 'D',
    description: 'E',
    categoryId: 'F',
    taxIndication: 'G',
    amount: 'H',
    netAmount: 'I',
    taxAmount: 'J',
    groupId: 'K'
}
export const ExpenseTemplate = {
    postedDate: 'A',
    referenceNumber: 'B',
    vendorId: 'C',
    paymentType: 'D',
    description: 'E',
    glAccountId: 'F',
    taxIndication: 'G',
    amount: 'H',
    netAmount: 'I',
    taxAmount: 'J',
    groupId: 'K'
}
export const PurchaseOrderTemplate = {
    postedDate: 'A',
    vendorId: 'B',
    paymentType: 'C',
    quickPO: 'D',
    materialId: 'E',
    uom: 'F',
    qty: 'G',
    unitPrice: 'H',
    totalAmount: 'I',
    groupId: 'J',
}

export const GoodsReceiptTemplate = {
    postedDate: 'A',
    restaurantId: 'B',
    poNumber: 'C',
    materialId: 'D',
    uom: 'E',
    qty: 'F',
    unitPrice: 'G',
    totalAmount: 'H'
}

export const ProductionEventTemplate = {
    postedDate: 'A',
    materialId: 'B',
    uom: 'C',
    qty: 'D'
}

export const WasteEventTemplate = {
    postedDate: 'A',
    materialId: 'B',
    uom: 'C',
    qty: 'D',
    reason: 'E'
}

export const VendorInvoice = {
    postedDate: 'A',
    vendorId: 'B',
    description: 'C',
    glAccountId: 'D',
    amount: 'E',
    taxAmount: 'F',
    groupId: 'G'
}

export const CustomerInvoice = {
    postedDate: 'A',
    customerId: 'B',
    description: 'C',
    glAccountId: 'D',
    amount: 'E',
    taxAmount: 'F',
    groupId: 'G'
}

export const AssetMaster = {
    name: 'A',
    nameAr: 'B',
    aquisitionDate: 'C',
    depreciationDate: 'D',
    retirementDate: 'E',
    aquisitionValue: 'F',
    lifeSpanNo: 'G',
    categoryId: 'H'
}

export const AssetAcquisition = {
    assetId: 'A',
    postedDate: 'B',
    vendorId: 'C',
    description: 'D',
    paymentType: 'E',
    referenceNumber: 'F',
    taxIndication: 'G',
    grossAmount: 'H',
    taxAmount: 'I'
}

export const MenuAdditions = {
    optionName: 'A',
    optionNameAr: 'B',
    price: 'C',
    calory: 'D',
    orderNo: 'E',
    default: 'F',
    additionName: 'G',
    additionNameAr: 'H',
    isMultipleAllowed: 'I',
    maxOption: 'J',
    minOption: 'K',
    groupId: 'L'
}

export const OfferTemplate = {
    name: 'A',
    nameAr: 'B',
    start: 'C',
    end: 'D',
    code: 'E',
    offerType: 'F',
    applicationType: 'G',
    discountType: 'H',
    discount: 'I',
    maxDiscount: 'J',
    maxNumberAllowed: 'K',
    priority: 'L',
    startTime: 'M',
    endTime: 'N',
    showName: 'O',
    // menuItemIds: 'P',
    // menuCategoryIds: 'Q',
};