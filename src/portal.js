import React from 'react';
import ReactDOM from 'react-dom/client';

class Portal {
  constructor() {
    this.nodes = [];
    this.roots = [];
  }
  
  open(component, props = {}) {
    const node = document.createElement("div");
    node.setAttribute("tabindex", "-1");
    node.style.position = "relative";
    document.body.appendChild(node);
    this.nodes.push(node);
    const root = ReactDOM.createRoot(node);
    this.roots.push(root);
    
    // Clone the component and pass props
    const ComponentToRender = React.cloneElement(component, {
      ...props,
      onClose: () => this.close(root, node),
    });
    root.render(ComponentToRender);
    
    return {
      close: () => this.close(root, node),
      update: (newProps) => {
        const UpdatedComponent = React.cloneElement(component, {
          ...newProps,
          onClose: () => this.close(root, node),
        });
        root.render(UpdatedComponent);
      },
    };
  }

  close(root, node) {
    if (root && node) {
      root.unmount();
      node.remove();
      // Remove from arrays
      const rootIndex = this.roots.indexOf(root);
      const nodeIndex = this.nodes.indexOf(node);
      if (rootIndex > -1) {
        this.roots.splice(rootIndex, 1);
      }
      if (nodeIndex > -1) {
        this.nodes.splice(nodeIndex, 1);
      }
      // Remove body class if no more portals
      if (this.nodes.length === 0) {
        document.body.classList.remove("portal-open");
      }
    }
  }
  
  closeAll() {
    // Close all open portals
    this.roots.forEach((root, index) => {
      if (root && this.nodes[index]) {
        root.unmount();
        this.nodes[index].remove();
      }
    });
    this.roots = [];
    this.nodes = [];
    document.body.classList.remove("portal-open");
  }
}

const portal = new Portal();
export { portal };
