import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO: Add to cart
      const newCart = [...cart];
      const itemExists = newCart.find(itemCart => itemCart.id === productId);

      const stock = await api.get<Stock>(`stock/${productId}`);

      const itemExistsAmount = itemExists ? itemExists.amount + 1 : 0;

      if (itemExistsAmount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (itemExists) {
        itemExists.amount = itemExists.amount + 1;
      } else {
        const response = await api.get(`products/${productId}`);
        const item = response.data;
  
        newCart.push({
          id: productId,
            title: item.title,
            amount: 1,
            image: item.image,
            price: item.price
        });
      }
      
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCartList = [...cart];
      const indexItemToRemove = cart.findIndex(product => product.id === productId);

      if (indexItemToRemove >= 0) {
        newCartList.splice(indexItemToRemove, 1);
        
        setCart(newCartList);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount === 0) return;

      const newCartList = [...cart];
      const itemToUpdate = newCartList.find(product => product.id === productId);

      const stock = await api.get<Stock>(`stock/${productId}`);

      if (amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (itemToUpdate) {
        itemToUpdate.amount = amount;
      }

      setCart(newCartList);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList));
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
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
