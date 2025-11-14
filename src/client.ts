import { caller } from "postmsg-rpc";
type Client = {};
type ClientOptions = {
  postMessage?: typeof window.postMessage;
};

export function constructClient(options?: ClientOptions): Client {
  const clientService = {
    "localStorage.setItem": (key: string, value: string) => {
      debugger;
      const fn = caller("localStorage.setItem", options);
      debugger;
      return fn(key, value);
    },
    "localStorage.getItem": (key: string) => {
      const fn = caller("localStorage.getItem", options);
      return fn(key);
    },
    "localStorage.removeItem": (key: string) => {
      const fn = caller("localStorage.removeItem", options);
      return fn(key);
    },
    "localStorage.clear": () => {
      const fn = caller("localStorage.clear", options);
      return fn();
    },
    "localStorage.key": (index: number) => {
      const fn = caller("localStorage.key", options);
      return fn(index);
    },
  };
  return {
    ...clientService,
  };
}
