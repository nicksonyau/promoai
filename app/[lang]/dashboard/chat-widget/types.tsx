export type WidgetSettings = {
  enabled: boolean;

  brand: {
    name: string;
    color: string;
    logo?: string;
  };

  launcher: {
    position: "left" | "right";
    style: "circle" | "rounded";
    text: string;
  };

  home: {
    title: string;
    subtitle: string;
  };

  chat: {
    placeholder: string;
    showAgent: boolean;
  };

  minimized: {
    label: string;
  };
};
