---
title: 树递归最重要的问题：函数到底返回什么
description: 用深度、直径、最近公共祖先和重建二叉树，练习为递归函数定义清晰的返回语义。
section: internship
date: 2026-08-02
tags: [算法, 二叉树, 递归]
---

二叉树递归代码通常很短，但我最容易在“这一层该做什么”上绕晕。后来形成了一个固定步骤：先用一句完整的话定义函数返回值，再写空节点，再组合左右结果。

## 深度：返回以当前节点为根的最大深度

```cpp
int maxDepth(TreeNode* root) {
    if (root == nullptr) return 0;
    return 1 + max(maxDepth(root->left), maxDepth(root->right));
}
```

这一定义让 `nullptr` 返回 `0` 自然成立，父节点只需取左右最大值再加自己。

翻转二叉树也可以用类似语义：函数返回“已经完成翻转的当前子树”。先递归翻转两个孩子，再交换返回结果即可。

## 直径：返回值与全局答案可以不同

直径经过某个节点时，等于左子树深度加右子树深度；但父节点需要的只是当前子树深度。因此用返回值向上传深度，用外部变量记录最大直径：

```cpp
int diameterOfBinaryTree(TreeNode* root) {
    int ans = 0;

    function<int(TreeNode*)> depth = [&](TreeNode* node) {
        if (node == nullptr) return 0;
        int left = depth(node->left);
        int right = depth(node->right);
        ans = max(ans, left + right);
        return 1 + max(left, right);
    };

    depth(root);
    return ans;
}
```

## 最近公共祖先：返回当前子树找到的目标代表

```cpp
TreeNode* lowestCommonAncestor(TreeNode* root,
                               TreeNode* p,
                               TreeNode* q) {
    if (root == nullptr || root == p || root == q) return root;

    TreeNode* left = lowestCommonAncestor(root->left, p, q);
    TreeNode* right = lowestCommonAncestor(root->right, p, q);
    if (left && right) return root;
    return left ? left : right;
}
```

若左右子树各返回一个目标，当前节点就是汇合点；若只有一侧非空，就把那一侧继续向上传。这个模板默认两个目标都存在于树中，题目条件改变时需要额外验证。

## 重建树：返回由区间构造出的根节点

已知前序和中序时，前序区间首元素是根；在中序数组中找到它，就能得到左右子树大小。关键不是复制数组，而是传递半开区间，并用哈希表保存“节点值到中序下标”的映射，使总复杂度保持在 `O(n)`。

每次递归都要确保区间长度守恒：

```text
根 1 个 + 左子树长度 + 右子树长度 = 当前区间长度
```

树递归不是魔法。只要写清输入代表哪棵子树、返回值给父节点什么信息、当前节点怎样组合孩子结果，代码会比先套模板更稳定。
