import { caller } from "postmsg-rpc";
type Client = {
  localStorage: {
    setItem: (key: string, value: string) => Promise<void>;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    key: (index: number) => Promise<string | null>;
  };
};
type ClientOptions = {
  postMessage?: typeof window.postMessage;
};

export function constructClient(options?: ClientOptions): Client {
  return {
    localStorage: {
      setItem: (key: string, value: string) =>
        caller("localStorage.setItem", options)(key, value),
      getItem: (key: string) => caller("localStorage.getItem", options)(key),

      removeItem: (key: string) =>
        caller("localStorage.removeItem", options)(key),
      clear: () => caller("localStorage.clear", options)(),
      key: (index: number) => caller("localStorage.key", options)(index),
    },
  };
}
