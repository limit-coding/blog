---
title: Hot21 合并两个有序链表
description: dummy 节点 + 双指针逐位比较，注意循环后接上剩余部分
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, 双指针]
---

## 思路

两个链表已经排好序，直接双指针比较值，小的接到结果链表上，指针后移。

## 代码

```cpp
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode* dummy = new ListNode(0);
        ListNode* cur = dummy;
        while (list1 != nullptr && list2 != nullptr) {
            if (list1->val > list2->val) {
                cur->next = list2;
                list2 = list2->next;
            } else {
                cur->next = list1;
                list1 = list1->next;
            }
            cur = cur->next;
        }
        if (list1 != nullptr) cur->next = list1;
        if (list2 != nullptr) cur->next = list2;
        return dummy->next;
    }
};
```

## 容易忘的细节

while 循环结束后，必然还有一个链表有剩余节点（另一个先跑完）。直接把剩余部分接到 cur->next 就行，不需要再逐个遍历。
