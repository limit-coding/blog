---
title: Hot146 LRU 缓存
description: 哈希表 + 双向链表实现 O(1) 读写的 LRU 缓存淘汰策略
section: internship
date: 2026-06-29
tags: [LeetCode, 设计, 哈希表, 链表]
---

## 思路

LRU（Least Recently Used）缓存：容量满时淘汰最久没访问的元素。

需要两个数据结构组合：
- **哈希表**：保证 O(1) 查找 key
- **双向链表**：维护访问顺序，最近访问的放头部，最久未访问的在尾部

每次 get 和 put 都把对应节点移到链表头部；容量超出时删除链表尾部节点。

## 代码

```cpp
class LRUCache {
public:
    struct Node {
        int key, val;
        Node* prev;
        Node* next;
        Node(int k, int v) : key(k), val(v), prev(nullptr), next(nullptr) {}
    };

    int cap;
    unordered_map<int, Node*> cache;
    Node* head;
    Node* tail;

    void addToHead(Node* node) {
        node->prev = head;
        node->next = head->next;
        head->next->prev = node;
        head->next = node;
    }

    void remove(Node* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }

    void moveToHead(Node* node) {
        remove(node);
        addToHead(node);
    }

    LRUCache(int capacity) {
        cap = capacity;
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head->next = tail;
        tail->prev = head;
    }

    int get(int key) {
        if (cache.find(key) == cache.end()) return -1;
        moveToHead(cache[key]);
        return cache[key]->val;
    }

    void put(int key, int value) {
        if (cache.find(key) != cache.end()) {
            cache[key]->val = value;
            moveToHead(cache[key]);
        } else {
            Node* node = new Node(key, value);
            cache[key] = node;
            addToHead(node);
            if ((int)cache.size() > cap) {
                Node* lru = tail->prev;
                remove(lru);
                cache.erase(lru->key);
                delete lru;
            }
        }
    }
};
```

## 设计细节

head 和 tail 用哨兵节点（dummy node），避免在链表头尾操作时处理空指针边界情况。真实数据节点始终夹在 head 和 tail 之间，`addToHead` 和 `remove` 逻辑因此统一，不需要特判。
