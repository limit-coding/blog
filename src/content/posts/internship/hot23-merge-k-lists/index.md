---
title: "Hot100-23. 合并 K 个升序链表"
description: "从合并两个链表出发，两种解法：逐一合并 O(kn) 与优先队列 O(N log k)"
section: internship
date: 2026-06-30
tags: [LeetCode, 链表, 优先队列, Hot100, C++]
---

## 思路

会合并两个有序链表，就能合并 K 个——把 K 个链表逐一往 result 上合并即可。

**合并两个有序链表的步骤：**
1. 设一个哨兵节点作为头
2. l1、l2 都不为空时，比较值，小的那个接上来
3. 最后把剩余部分直接接上
4. 记得递增 current

## 解法一：逐一合并 O(kn)

```cpp
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {
        ListNode* dummy = new ListNode(0);
        ListNode* cur = dummy;
        while (l1 != nullptr && l2 != nullptr) {
            if (l1->val <= l2->val) {
                cur->next = l1;
                l1 = l1->next;
            } else {
                cur->next = l2;
                l2 = l2->next;
            }
            cur = cur->next;
        }
        if (l1 != nullptr) cur->next = l1;
        if (l2 != nullptr) cur->next = l2;
        return dummy->next;
    }

    ListNode* mergeKLists(vector<ListNode*>& lists) {
        ListNode* result = nullptr;
        for (int i = 0; i < lists.size(); i++) {
            result = mergeTwoLists(result, lists[i]);
        }
        return result;
    }
};
```

result 初始为 null，先跟 lists[0] 合并，再跟 lists[1] 合并……相当于套了一层外循环。时间复杂度 O(kn)。

## 解法二：优先队列 O(N log k)

用小根堆，每次从 K 个链表的当前头节点里取最小的，不用逐一扫描：

```cpp
class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);

        for (auto node : lists)
            if (node) pq.push(node);

        ListNode dummy(0);
        ListNode* cur = &dummy;
        while (!pq.empty()) {
            cur->next = pq.top(); pq.pop();
            cur = cur->next;
            if (cur->next) pq.push(cur->next);
        }
        return dummy.next;
    }
};
```

每次 pop 最小节点接上，再把它的 next 推入堆。堆大小始终 ≤ k，操作复杂度 O(log k)，总复杂度 O(N log k)，面试标准答案。
