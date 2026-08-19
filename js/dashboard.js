/**
 * Restaurant Kitchen & Cashier Admin Dashboard AngularJS Application
 * ระบบจัดการออเดอร์ "ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ"
 */

const dashApp = angular.module('DashboardApp', []);

dashApp.controller('DashboardCtrl', ['$scope', '$http', '$interval', '$timeout', function($scope, $http, $interval, $timeout) {
  // 1. สถานะและการตั้งค่า
  $scope.config = CONFIG;
  $scope.activeTab = 'kanban'; // 'kanban' | 'stock' | 'history'
  $scope.isSoundEnabled = true;
  $scope.isSyncing = false;
  $scope.currentTime = '';
  $scope.searchQuery = '';

  // รายการออเดอร์และเมนู
  $scope.orders = [];
  $scope.menus = [];
  $scope.knownOrderIds = new Set();
  $scope.lastNewOrderId = null;

  // 2. นาฬิกาแบบเรียลไทม์
  function updateClock() {
    const now = new Date();
    $scope.currentTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  updateClock();
  $interval(updateClock, 1000);

  // 3. สลับเปิด/ปิดเสียงแจ้งเตือน
  $scope.toggleSound = function() {
    $scope.isSoundEnabled = !$scope.isSoundEnabled;
    if ($scope.isSoundEnabled && typeof SoundService !== 'undefined') {
      SoundService.playSuccess();
    }
  };

  // 4. สลับแท็บ
  $scope.setTab = function(tabName) {
    $scope.activeTab = tabName;
  };

  // 5. โหลดออเดอร์ทั้งหมด
  $scope.loadOrders = function(isSilent) {
    if (!isSilent) $scope.isSyncing = true;

    if ($scope.config.GAS_WEB_APP_URL && $scope.config.GAS_WEB_APP_URL.trim() !== "") {
      $http.get($scope.config.GAS_WEB_APP_URL + '?action=getOrders')
        .then(function(res) {
          if (res.data && res.data.success && Array.isArray(res.data.data)) {
            $scope.processIncomingOrders(res.data.data);
          } else {
            $scope.loadLocalOrders();
          }
          $scope.isSyncing = false;
        })
        .catch(function(err) {
          console.warn("GAS Connection error:", err);
          $scope.loadLocalOrders();
          $scope.isSyncing = false;
        });
    } else {
      $scope.loadLocalOrders();
      $scope.isSyncing = false;
    }
  };

  $scope.loadLocalOrders = function() {
    let localOrders = [];
    try {
      const saved = localStorage.getItem('kinyard_mock_orders');
      if (saved) {
        localOrders = JSON.parse(saved);
      } else {
        localOrders = angular.copy(CONFIG.INITIAL_MOCK_ORDERS);
        localStorage.setItem('kinyard_mock_orders', JSON.stringify(localOrders));
      }
    } catch(e) {
      localOrders = angular.copy(CONFIG.INITIAL_MOCK_ORDERS);
    }
    $scope.processIncomingOrders(localOrders);
  };

  // ประมวลผลและตรวจหาออเดอร์ใหม่เพื่อเล่นเสียงเตือน
  $scope.processIncomingOrders = function(incomingList) {
    let hasNewPendingOrder = false;

    incomingList.forEach(function(order) {
      if (!$scope.knownOrderIds.has(order.order_id)) {
        $scope.knownOrderIds.add(order.order_id);
        if (order.status === 'Pending') {
          hasNewPendingOrder = true;
          $scope.lastNewOrderId = order.order_id;
        }
      }
    });

    $scope.orders = incomingList;

    // เล่นเสียงเตือนเมื่อมีออเดอร์ใหม่สถานะ Pending
    if (hasNewPendingOrder && $scope.isSoundEnabled && typeof SoundService !== 'undefined') {
      SoundService.playOrderChime();
    }
  };

  // 6. โหลดเมนูสำหรับหน้าจัดการสต็อก
  $scope.loadMenus = function() {
    if ($scope.config.GAS_WEB_APP_URL && $scope.config.GAS_WEB_APP_URL.trim() !== "") {
      $http.get($scope.config.GAS_WEB_APP_URL + '?action=getMenus')
        .then(function(res) {
          if (res.data && res.data.success && Array.isArray(res.data.data)) {
            $scope.menus = res.data.data;
          } else {
            $scope.loadLocalMenus();
          }
        })
        .catch(function() {
          $scope.loadLocalMenus();
        });
    } else {
      $scope.loadLocalMenus();
    }
  };

  $scope.loadLocalMenus = function() {
    try {
      const saved = localStorage.getItem('kinyard_menus');
      if (saved) {
        $scope.menus = JSON.parse(saved);
      } else {
        $scope.menus = angular.copy(CONFIG.DEFAULT_MENUS);
        localStorage.setItem('kinyard_menus', JSON.stringify($scope.menus));
      }
    } catch(e) {
      $scope.menus = angular.copy(CONFIG.DEFAULT_MENUS);
    }
  };

  // 7. เปลี่ยนสถานะออเดอร์ (Workflow: Pending -> Cooking -> Served -> Completed / Cancelled)
  $scope.updateOrderStatus = function(order, newStatus, newPaymentStatus) {
    $scope.isSyncing = true;
    const oldStatus = order.status;
    order.status = newStatus;
    if (newPaymentStatus) {
      order.payment_status = newPaymentStatus;
    }

    const payload = {
      action: 'updateOrderStatus',
      order_id: order.order_id,
      status: newStatus,
      payment_status: order.payment_status
    };

    if ($scope.config.GAS_WEB_APP_URL && $scope.config.GAS_WEB_APP_URL.trim() !== "") {
      $http.post($scope.config.GAS_WEB_APP_URL, JSON.stringify(payload), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      })
      .then(function(res) {
        $scope.isSyncing = false;
        if (typeof SoundService !== 'undefined') SoundService.playSuccess();
      })
      .catch(function(err) {
        console.warn("Update status GAS error:", err);
        $scope.syncLocalOrderUpdate(order);
        $scope.isSyncing = false;
      });
    } else {
      $scope.syncLocalOrderUpdate(order);
      $scope.isSyncing = false;
      if (typeof SoundService !== 'undefined') SoundService.playSuccess();
    }
  };

  $scope.syncLocalOrderUpdate = function(order) {
    try {
      const mockOrders = JSON.parse(localStorage.getItem('kinyard_mock_orders') || '[]');
      const index = mockOrders.findIndex(function(o) { return o.order_id === order.order_id; });
      if (index !== -1) {
        mockOrders[index].status = order.status;
        mockOrders[index].payment_status = order.payment_status;
        localStorage.setItem('kinyard_mock_orders', JSON.stringify(mockOrders));
      }
    } catch(e) {}
  };

  // 8. เปิด/ปิดสถานะเมนู (Stock In / Out)
  $scope.toggleMenuStatus = function(menu) {
    menu.is_available = !menu.is_available;
    $scope.isSyncing = true;

    const payload = {
      action: 'toggleMenuAvailability',
      menu_id: menu.id,
      is_available: menu.is_available
    };

    if ($scope.config.GAS_WEB_APP_URL && $scope.config.GAS_WEB_APP_URL.trim() !== "") {
      $http.post($scope.config.GAS_WEB_APP_URL, JSON.stringify(payload), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      })
      .then(function() {
        $scope.isSyncing = false;
        $scope.saveMenusToStorage();
      })
      .catch(function() {
        $scope.saveMenusToStorage();
        $scope.isSyncing = false;
      });
    } else {
      $scope.saveMenusToStorage();
      $scope.isSyncing = false;
    }
  };

  $scope.saveMenusToStorage = function() {
    localStorage.setItem('kinyard_menus', JSON.stringify($scope.menus));
  };

  // 9. ตัวกรองออเดอร์ตามสถานะสำหรับ Kanban
  $scope.getOrdersByStatus = function(status) {
    return $scope.orders.filter(function(o) {
      return o.status === status;
    });
  };

  // 10. สถิติภาพรวม (Dashboard Metrics)
  $scope.getCountByStatus = function(status) {
    return $scope.orders.filter(function(o) { return o.status === status; }).length;
  };

  $scope.getTotalSales = function() {
    return $scope.orders
      .filter(function(o) { return o.status !== 'Cancelled'; })
      .reduce(function(total, o) { return total + (Number(o.total_price) || 0); }, 0);
  };

  $scope.getActiveTablesCount = function() {
    const activeTables = new Set();
    $scope.orders.forEach(function(o) {
      if (o.status === 'Pending' || o.status === 'Cooking' || o.status === 'Served') {
        if (o.table_no) activeTables.add(o.table_no);
      }
    });
    return activeTables.size;
  };

  // 11. ตัวกรองสำหรับประวัติออเดอร์
  $scope.filterHistory = function(order) {
    if (!$scope.searchQuery) return true;
    const q = $scope.searchQuery.toLowerCase();
    return (order.order_id && order.order_id.toLowerCase().includes(q)) ||
           (order.table_no && order.table_no.toLowerCase().includes(q)) ||
           (order.customer_name && order.customer_name.toLowerCase().includes(q));
  };

  // 12. Auto Polling ทุก 6 วินาที
  const pollingInterval = $interval(function() {
    $scope.loadOrders(true);
  }, 6000);

  $scope.$on('$destroy', function() {
    if (pollingInterval) $interval.cancel(pollingInterval);
  });

  // Init Dashboard
  $scope.init = function() {
    $scope.loadOrders(false);
    $scope.loadMenus();
  };

  $scope.init();
}]);
