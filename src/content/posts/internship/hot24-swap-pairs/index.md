---
title: Hot24 两两交换链表节点
description: 三个临时指针完成每组两节点交换，理清为什么需要第三个指针
section: internship
date: 2026-06-29
tags: [LeetCode, 链表]
---

## 思路

每次处理两个相邻节点，用三个临时指针保存关键地址：`temp1`（第一个节点）、`temp2`（第二个节点）、`temp3`（后续链表的头）。

## 代码

```cpp
class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode* dummy = new ListNode(0);
        dummy->next = head;
        ListNode* cur = dummy;
        while (cur->next != nullptr && cur->next->next != nullptr) {
            auto temp1 = cur->next;
            auto temp2 = temp1->next;
            auto temp3 = temp2->next;
            // 交换
            cur->next = temp2;
            temp2->next = temp1;
            temp1->next = temp3;
            // 移动到下一组
            cur = temp1;
        }
        return dummy->next;
    }
};
```

## 为什么需要三个指针

1. `temp1` 和 `temp2`：执行交换需要两个节点地址
2. `temp3`：交换结束后，`temp1` 要接上后面的链表，必须事先保存后续头节点地址，否则链表断掉

交换结束后 cur 移到 `temp1`（交换后的第二个节点），继续处理下一对。
