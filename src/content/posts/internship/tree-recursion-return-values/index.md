---
title: 树递归最重要的问题：函数到底返回什么
description: 用深度、直径、最近公共祖先和重建二叉树，练习为递归函数定义清晰的返回语义。
section: internship
date: 2026-08-02
tags: [算法, 二叉树, 递归]
---

# Leetcode 104



```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int maxDepth(TreeNode* root) {

      //还是走的遍历，递归
      if(root==nullptr){
        return 0;
      }
      int leftDepth=maxDepth(root->left);
      int rightDepth=maxDepth(root->right);


      return max(leftDepth,rightDepth)+1;
    }
};

```



这个就是二叉树的遍历，找高度

需要用递归，从左走的全走到头；从右走的走到头，注意，到了nullptr的时候，会回复0，然后但是单只有单节点的时候，这个实际上深度是1，


```
return max(leftDepth,rightDepth)+1;

```

---

# Leetcode226 翻转二叉树



```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        //仍然用递归
        if(root==nullptr) return nullptr;
        //应该有个交换
        swap(root->left,root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};

```



这个的关键就是左和右

二叉树是跟递归很深的东西‘

有个交换就行，交换完了返回root

---

# Leetcode543 二叉树的直径




```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int ans=0;
    int height(TreeNode* node){
      if(!node) return 0;
      int left=height(node->left);
      int right=height(node->right);
      ans=max(ans,left+right);
      return max(left,right)+1;

    }
    int diameterOfBinaryTree(TreeNode* root) {
        height(root);
        return ans;
    }
};

```

本质 3递归，先一直往下钻钻到叶子节点，然后max(left,right)+1就是返回较高节点的上一个父节点；

但是这个的关键是怎么理解直径，直径就是左子树+右子树的高度
**2. 为什么"任意两点间最长路径"能转化成"左高度+右高度"？**
任意一条路径，一定存在一个"最高点"（也就是路径上深度最小的那个节点，图论里叫 LCA，最近公共祖先）。这条路径可以拆成两段：从最高点往左下走的一段，和往右下走的一段。
比如路径 5 → 3 → 2 → 4，最高点是 2。从 2 往左下（经过3）走到5，长度2；从2往右下走到4，长度1。加起来就是路径总长度 3。
所以：**任意一条路径的长度，等于它的最高点的"左子树深度 + 右子树深度"。**
**3. 于是问题变成：枚举每个节点当"最高点"，看它撑起的路径有多长。**
对每个节点 node，以它为最高点能撑起的最长路径 = 左子树的高度 + 右子树的高度（因为路径要往左边尽量深地扎、往右边尽量深地扎，才能最长）。

---

# Leetcode236LCA



```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if(root==nullptr || p==root || q==root){
          return root;
        }
        TreeNode* left=lowestCommonAncestor(root->left,p,q);
        TreeNode* right=lowestCommonAncestor(root->right,p,q);
        if(left && right) {
          return root;
        }
        return left?left:right;

    }
};

```



这个要用后序遍历，那个left和right就是正常的遍历到null,然后往回走的时候，优先走left，然后走right，就是后序：左右根，当左右都不是null的时候才返回根，不然就先返回left

其实本质上回溯，如果pq都是一侧，那么就去那一侧，就是return left?left:right
如果不是一侧，那就两侧的话，且

返回值的含义你要先想清楚：这个函数返回什么，不是"随便一个节点"，而是有明确语义的——
* 返回 nullptr：这棵子树里 p 和 q 都不存在。
* 返回某个非空节点 X：说明这棵子树里"已经找到答案的线索"，X 要么是 p 本身，要么是 q 本身，要么就是已经算出来的 LCA（p、q 都在这棵子树里，且已经在更深层被判定出汇合点了）。
明白这个之后，
     left && right
  都非空是什么意思就清楚了：
左子树返回非空，说明 p 或 q（至少一个）藏在左子树里；右子树返回非空，说明 p 或 q（至少一个）藏在右子树里。因为 p 和 q 是两个不同的节点，左右子树又是完全不相交的两块地盘，如果两边都有"命中"，唯一的可能就是：p 在左边，q 在右边（或反过来），不可能出现两个都在左边这种情况（那样右边就该是 null 了）。
也就是说，一旦左右都非空，就证明了"root 是 p 和 q 路径分叉的那个点"——p 走到 root 往左才能碰到，q 走到 root 往右才能碰到，root 正是它们路径分开的最后一个公共节点，这正是 LCA 的定义。所以此时直接
     return root
 ，不用再看 left 和 right 具体是什么值。
反过来，如果只有一边非空（比如 left 非空、right 是 null），说明 p、q 要么都在左子树里（这时 left 已经是算好的 LCA 了），要么只有其中一个在左子树、另一个还没找到（这时 left 就是 p 或 q 本身）。不管哪种情况，root 都不是答案，只是搬运工，把 left 原样往上传（
     return left
 ），交给更上层去判断。

对，函数调用是从 root 开始的，但实际的"处理顺序"（后序遍历）是先一路递归到底，再从底往上处理。
具体过程分两个阶段：
**下潜阶段**（递归调用，还没执行任何判断逻辑）： 从 root 出发，一路调用 lowestCommonAncestor(root->left, ...)，不断往左（或右）下探，每次先压栈，直到碰到 nullptr 或者碰到 p/q 本身才返回。这个阶段只是在"占位"，还没真正比较 left 和 right。
**回溯阶段**（执行 if 判断，真正的逻辑发生在这里）： 递归到底之后开始一层层 return，每一层拿到自己左右子树的返回值后，才执行 if(left && right) 这行判断。这个判断是从最深的节点开始逐层往浅处执行的，最后才轮到 root 执行这个判断。
用前面那棵树举例（p=7, q=4）：
        3
       / \
      5   1
     / \
    6   2
       / \
      7   4
调用顺序（下潜，从 root=3 出发）： 3 → 5 → 6（触底，left=null,right=null，返回 null）→ 回到5，再调用 2 → 7（触底，7==p，返回7）→回到2，再调用 4（触底，4==q，返回4）→ 回到2，此时 left=7,right=4 都非空，**在节点2这一层**判断成立，返回 2 → 回到5，left=null(来自6),right=2，返回2 → 回到3，同理右边1那支返回null → 3层判断 left=2,right=null，返回2。
所以最终答案 2 是在**节点2那一层的回溯阶段**产生的，然后作为"确定结果"沿着调用栈原路传回 root，中间各层不再改变它、只是透传。这就是为什么感觉像"从下往上"，其实是递归返回值在传递，不是真的有一个指针从叶子往根走。

---

# Leetcode105




```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:


    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        unordered_map<int,int> idxMap;
        for(int i=0;i<inorder.size();i++){
          idxMap[inorder[i]]=i;
        }
        int pre_idx=0;
        return build(preorder,idxMap,pre_idx,0,(int)inorder.size()-1);
    }
    TreeNode* build(vector<int>& preorder,unordered_map<int,int>& idxMap,int& pre_idx,int inLeft,int inRight){
      if(inLeft>inRight) return nullptr;

      int root_val=preorder[pre_idx++];
      auto root=new TreeNode(root_val);
      int mid=idxMap[root_val];
      root->left=build(preorder,idxMap,pre_idx,inLeft,mid-1);
      root->right=build(preorder,idxMap,pre_idx,mid+1,inRight);

      return root;
    }
};

```




S
