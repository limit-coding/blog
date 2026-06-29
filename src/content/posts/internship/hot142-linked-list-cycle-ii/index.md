---
title: Hot142 环形链表 II
description: 快慢指针找到相遇点后，再用数学推导找到环的入口节点
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, 快慢指针]
cover: ./cover.jpg
---

## 思路

和 Hot141 一样先用快慢指针找相遇点，区别是这题要找到**环的入口节点**，而不只是判断有没有环。

## 数学推导

定义：
- `a`：head 到环入口的距离
- `b`：环入口到相遇点的距离
- `c`：相遇点到环入口的距离（即绕回入口还差多少）

fast 走的距离：`a + n*(b+c) + b`（先到入口，在环里转 n 圈，再走到相遇点）

slow 走的距离：`a + b`

fast = 2 * slow，所以：

```
a + n*(b+c) + b = 2(a+b)
a = n*(b+c) - b = (n-1)*(b+c) + c
```

当 n=1 时，`a = c`。

**结论**：从 head 出发的 `ptr` 走 `a` 步，从相遇点出发的 `slow` 在环里走 `c` 步，两者会在环入口相遇。

n > 1 时 slow 多转几圈，最终结果一样——slow 只要在环里不停走，必然会在入口遇到 ptr。

## 代码

```cpp
class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        ListNode* fast = head;
        ListNode* slow = head;
        while (fast != nullptr && fast->next != nullptr) {
            fast = fast->next->next;
            slow = slow->next;
            if (slow == fast) {
                ListNode* ptr = head;
                while (ptr != slow) {
                    ptr = ptr->next;
                    slow = slow->next;
                }
                return ptr;
            }
        }
        return nullptr;
    }
};
```

## 一个小 bug

之前写成了先动再判：

```cpp
while (ptr != nullptr) {
    ptr = ptr->next;   // 先动
    slow = slow->next;
    if (ptr == slow)   // 再判，漏了初始就相等的情况
```

改成 `while (ptr != slow)` 之后，进循环第一件事就是判断，相等立刻退出，完全正确。
