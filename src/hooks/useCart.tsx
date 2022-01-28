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
      const newCart = [...cart];

      const hasProductCart = newCart.find(
        (product) => product.id === productId
      );
      const productData = (await api.get(`/products/${productId}`)).data;
      const stockData: Stock = (await api.get(`/stock/${productId}`)).data;

      if (hasProductCart) {
        // adicionando +1 na quantidade do produto
        hasProductCart.amount = hasProductCart.amount + 1;

        if (hasProductCart?.amount > stockData.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          setCart(newCart);
        }
      } else {
        const newProduct = {
          ...productData,
          amount: 1,
        };

        newCart.push(newProduct);
      }
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter((item) => item.id !== productId));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      console.log(
        `atualizando o produto ${productId} nova quantidade ${amount}`
      );

      const stockAmount = (await api.get(`/stock/${productId}`)).data;

      console.log(stockAmount);
      console.log(amount);

      if (stockAmount.amount >= amount) {
        const newCart = cart.map((product) => {
          return {
            ...product,
            amount: productId === product.id ? amount : product.amount,
          };
        });

        setCart(newCart);
      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
