import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  TextField,
  Heading,
  Flex,
  View,
  Grid,
  Text,
  SelectField,
  Image,
  useTheme,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { uploadData, getUrl } from 'aws-amplify/storage';
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient();

// Custom authentication components
const components = {
  Header() {
    const { tokens } = useTheme();

    return (
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        padding={tokens.space.large}
      >
        <Heading level={3}>Warehouse Management System</Heading>
      </Flex>
    );
  },
};

// Custom authentication form fields
const formFields = {
  signUp: {
    email: {
      order: 1,
      isRequired: true,
    },
    password: {
      order: 2,
      isRequired: true,
    },
    confirm_password: {
      order: 3,
      isRequired: true,
    },
  },
  signIn: {
    email: {
      order: 1,
      isRequired: true,
    },
    password: {
      order: 2,
      isRequired: true,
    },
  },
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [productImages, setProductImages] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  useEffect(() => {
    products.forEach(async (product) => {
      if (product.image) {
        try {
          const url = await getUrl({ key: product.image });
          setProductImages(prev => ({
            ...prev,
            [product.id]: url.url
          }));
        } catch (error) {
          console.error("Error loading image:", error);
        }
      }
    });
  }, [products]);

  async function fetchProducts() {
    try {
      const { data: productList } = await client.models.Product.list();
      setProducts(productList);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }

  async function fetchTransactions() {
    try {
      const { data: transactionList } = await client.models.Transaction.list();
      setTransactions(transactionList);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }

  async function handleImageUpload(file, productCode) {
    try {
      const key = `products/${productCode}-${file.name}`;
      await uploadData({
        key,
        data: file,
      });
      return key;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const imageFile = event.target.image.files[0];

    try {
      let imageKey = null;
      if (imageFile) {
        imageKey = await handleImageUpload(imageFile, form.get("code"));
      }

      const { data: newProduct } = await client.models.Product.create({
        code: form.get("code"),
        sku: form.get("sku"),
        image: imageKey,
        categoryName: form.get("categoryName"),
        status: form.get("status"),
        restock_level: parseInt(form.get("restock_level"), 10),
        vendor: form.get("vendor"),
        stock_in_hand: 0,
        kevin_quantity: 0,
        jayesh_quantity: 0,
        retail_quantity: 0,
        createdAt: new Date().toISOString(),
        createdBy: form.get("createdBy"),
        isActive: true,
      });

      console.log("Created product:", newProduct);
      fetchProducts();
      event.target.reset();
    } catch (error) {
      console.error("Error creating product:", error);
    }
  }

  async function createTransaction(event) {
    event.preventDefault();
    const form = new FormData(event.target);

    try {
      const { data: newTransaction } = await client.models.Transaction.create({
        quantity: parseInt(form.get("quantity"), 10),
        type: form.get("type"),
        channel: form.get("channel"),
        unitCost: form.get("type") === "IN" ? parseFloat(form.get("unitCost")) : null,
        transactionDate: new Date().toISOString(),
        notes: form.get("notes"),
        reference: form.get("reference"),
        productId: form.get("productId"),
        createdAt: new Date().toISOString(),
        createdBy: form.get("createdBy"),
      });

      console.log("Created transaction:", newTransaction);
      fetchTransactions();
      fetchProducts();
      event.target.reset();
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  }

  return (
    <Authenticator
      components={components}
      formFields={formFields}
      hideSignUp={false}
    >
      {({ signOut, user }) => (
        <Flex direction="column" padding="2rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading level={1}>Warehouse Management System</Heading>
            <Flex alignItems="center" gap="1rem">
              <Text>Signed in as: {user?.attributes?.email}</Text>
              <Button onClick={signOut}>Sign Out</Button>
            </Flex>
          </Flex>

          {/* Product Creation Form */}
          <View as="form" margin="3rem 0" onSubmit={createProduct}>
            <Heading level={2}>Add New Product</Heading>
            <Grid templateColumns="1fr 1fr 1fr" gap="1rem">
              <TextField
                name="code"
                placeholder="Product Code"
                label="Product Code"
                required
              />
              <TextField
                name="sku"
                placeholder="SKU"
                label="SKU"
                required
              />
              <TextField
                name="categoryName"
                placeholder="Category Name"
                label="Category Name"
                required
              />
              <SelectField
                name="status"
                label="Status"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="DISCONTINUED">Discontinued</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </SelectField>
              <TextField
                name="restock_level"
                placeholder="Restock Level"
                label="Restock Level"
                type="number"
                required
              />
              <TextField
                name="vendor"
                placeholder="Vendor"
                label="Vendor"
                required
              />
              <TextField
                name="image"
                type="file"
                accept="image/*"
                label="Product Image"
              />
              <TextField
                name="createdBy"
                label="Created By"
                value={user?.attributes?.email}
                required
                isReadOnly
              />
            </Grid>
            <Button type="submit" variation="primary" marginTop="1rem">
              Create Product
            </Button>
          </View>

          {/* Transaction Creation Form */}
          <View as="form" margin="3rem 0" onSubmit={createTransaction}>
            <Heading level={2}>Add New Transaction</Heading>
            <Grid templateColumns="1fr 1fr 1fr" gap="1rem">
              <SelectField
                name="productId"
                label="Product"
                required
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.sku}
                  </option>
                ))}
              </SelectField>
              <SelectField
                name="type"
                label="Transaction Type"
                required
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </SelectField>
              <SelectField
                name="channel"
                label="Channel"
                required
              >
                <option value="KEVIN">Kevin</option>
                <option value="JAYESH">Jayesh</option>
                <option value="RETAIL">Retail</option>
              </SelectField>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                required
              />
              <TextField
                name="unitCost"
                label="Unit Cost"
                type="number"
                step="0.01"
              />
              <TextField
                name="reference"
                label="Reference"
              />
              <TextField
                name="notes"
                label="Notes"
              />
              <TextField
                name="createdBy"
                label="Created By"
                value={user?.attributes?.email}
                required
                isReadOnly
              />
            </Grid>
            <Button type="submit" variation="primary" marginTop="1rem">
              Create Transaction
            </Button>
          </View>

          {/* Product List */}
          <Heading level={2}>Product List</Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap="1rem">
            {products.map((product) => (
              <Flex
                key={product.id}
                direction="column"
                padding="1rem"
                backgroundColor="white"
                borderRadius="medium"
                border="1px solid"
                borderColor="gray.300"
              >
                {productImages[product.id] && (
                  <Image
                    src={productImages[product.id]}
                    alt={product.code}
                    objectFit="cover"
                    width="100%"
                    height="200px"
                    marginBottom="1rem"
                  />
                )}
                <Heading level={3}>{product.code}</Heading>
                <Text>SKU: {product.sku}</Text>
                <Text>Category: {product.categoryName}</Text>
                <Text>Status: {product.status}</Text>
                <Text>Stock: {product.stock_in_hand}</Text>
                <Text>Restock Level: {product.restock_level}</Text>
                <Text>Vendor: {product.vendor}</Text>
                <Grid templateColumns="1fr 1fr 1fr" gap="0.5rem">
                  <Text>Kevin: {product.kevin_quantity}</Text>
                  <Text>Jayesh: {product.jayesh_quantity}</Text>
                  <Text>Retail: {product.retail_quantity}</Text>
                </Grid>
              </Flex>
            ))}
          </Grid>
        </Flex>
      )}
    </Authenticator>
  );
}
