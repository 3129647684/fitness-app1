// 轻量全局模块级缓存，用于动作选择页与记录页之间传递选中的训练动作
// （避免依赖复杂导航参数传递）

export interface SelectedAction {
  actionId: string;
  actionName: string;
  muscle: string;
}

let pendingAction: SelectedAction | null = null;

export function setPendingAction(action: SelectedAction): void {
  pendingAction = action;
}

export function takePendingAction(): SelectedAction | null {
  const a = pendingAction;
  pendingAction = null;
  return a;
}