import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Define type-safe enums
type TransactionType = 'IN' | 'OUT';
type ProductStatus = 'ACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';
type ChannelType = 'KEVIN' | 'JAYESH' | 'RETAIL';

const schema = a.schema({
  Product: a.model({
    // Primary identifiers
    id: a.id().required(),
    code: a.string().required(), // Unique, non-editable
    sku: a.string().required(), // Searchable, editable
    image: a.string(),
    
    categoryName: a.string().required(),
    status: a.enum(['ACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK']),
    
    // Inventory and Cost tracking
    lastPurchaseCost: a.float(),
    stock_in_hand: a.integer().default(0),
    restock_level: a.integer().required(),
    
    // Channel-wise tracking
    kevin_quantity: a.integer().default(0),
    jayesh_quantity: a.integer().default(0),
    retail_quantity: a.integer().default(0),
    
    // Supplier info
    vendor: a.string().required(),
    
    // Metadata
    createdAt: a.datetime().required(),
    updatedAt: a.datetime(),
    createdBy: a.email().required(),
    updatedBy: a.email(),
    isActive: a.boolean().default(true),

    // Relationships
    transactions: a.hasMany('Transaction', 'productId'),
  })
  .authorization((allow) => [
    allow.guest().to(['read']),
    allow.authenticated().to(['create', 'read', 'update', 'delete'])
  ]),
  
  Transaction: a.model({
    // Primary identifier
    id: a.id().required(),
    
    // Transaction details
    quantity: a.integer().required(),
    type: a.enum(['IN', 'OUT']),
    channel: a.enum(['KEVIN', 'JAYESH', 'RETAIL']), // Required for OUT transactions
    unitCost: a.float(), // Optional, only for IN transactions
    
    // Transaction metadata
    transactionDate: a.datetime().required(),
    notes: a.string(),
    reference: a.string(),
    
    // Audit fields
    createdAt: a.datetime().required(),
    updatedAt: a.datetime(),
    createdBy: a.email().required(),
    updatedBy: a.email(),

    // Relationships
    productId: a.id().required(),
    product: a.belongsTo('Product', 'productId'),
  })
  .authorization((allow) => [
    allow.guest().to(['read']),
    allow.authenticated().to(['create', 'read', 'update', 'delete'])
  ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
  }
});