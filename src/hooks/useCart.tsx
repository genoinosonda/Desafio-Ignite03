import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      //console.log(JSON.parse(storagedCart));
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // realiza o incremento de um produto dentro da sessão, apos a atualização do use hook do cart
  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const productOnCart = cart.find((product) => product.id === productId);

      if (!productOnCart) {
        const responseProduct: Product = (
          await api.get(`/products/${productId}`)
        ).data;

        const newCart = [
          ...cart,
          {
            ...responseProduct,
            amount: 1,
          },
        ];

        setCart(newCart);

        toast.success("produto adicionado");
      } else if (productOnCart) {
        const stockNumber: Stock = (await api.get(`/stock/${productId}`)).data;
        if (stockNumber.amount > productOnCart.amount) {
          const newCart = cart.map((product) => {
            return {
              ...product,
              amount:
                productId == product.id ? product.amount + 1 : product.amount,
            };
          });

          setCart(newCart);
          toast.success("produto adicionado");
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Não foi possível adicionar o produto!");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter((item) => item.id !== productId));

      toast.success("Protudo removido com sucesso");
    } catch {
      toast.error("Não foi possível remover o produto!");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
