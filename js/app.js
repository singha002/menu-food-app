/**
 * Customer Food Ordering AngularJS Application
 * สำหรับลูกค้าสั่งอาหาร "ร้านกินยาร์ด ก๋วยเตี๋ยวเรือ"
 */

const app = angular.module('FoodApp', []);

app.controller('FoodOrderCtrl', ['$scope', '$http', '$interval', '$timeout', function($scope, $http, $interval, $timeout) {
  // 1. ตัวแปรสถานะและคอนฟิก
  $scope.config = CONFIG;
  $scope.categories = CONFIG.CATEGORIES;
  $scope.tables = CONFIG.TABLES;
  $scope.selectedCategory = 'all';
  $scope.searchQuery = '';

  // โต๊ะและข้อมูลลูกค้า
  $scope.selectedTable = localStorage.getItem('kinyard_selected_table') || $scope.tables[0];
  $scope.customerName = localStorage.getItem('kinyard_customer_name') || '';
  $scope.customerPhone = localStorage.getItem('kinyard_customer_phone') || '';
  $scope.orderNote = '';

  // รายการอาหารและตะกร้า
  $scope.menus = [];
  $scope.cart = [];
  $scope.isLoadingMenus = true;
  $scope.isSubmittingOrder = false;

  // Modals state
  $scope.isCustomizeModalOpen = false;
  $scope.isCartModalOpen = false;
  $scope.selectedMenu = null;
  $scope.customOptions = {};
  $scope.itemQuantity = 1;
  $scope.itemNote = '';

  // Tracking Active Order
  $scope.activeOrder = null;
  $scope.isTrackingView = false;
  let statusPollInterval = null;

  // Toast Notification
  $scope.toastMessage = '';
  $scope.showToast = false;

  $scope.triggerToast = function(msg) {
    $scope.toastMessage = msg;
    $scope.showToast = true;
    $timeout(function() {
      $scope.showToast = false;
    }, 2800);
  };

  // 2. บันทึกโต๊ะเมื่อเปลี่ยน
  $scope.onTableChange = function() {
    localStorage.setItem('kinyard_selected_table', $scope.selectedTable);
    $scope.triggerToast('เลือก ' + $scope.selectedTable);
  };

  // 3. โหลดรายการอาหาร (จาก GAS หรือ Mock)
  $scope.loadMenus = function() {
    $scope.isLoadingMenus = true;

    if ($scope.config.GAS_WEB_APP_URL && $scope.config.GAS_WEB_APP_URL.trim() !== "") {
      $http.get($scope.config.GAS_WEB_APP_URL + '?action=getMenus')
        .then(function(res) {
          if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
            $scope.menus = res.data.data;
          } else {
            $scope.fallbackToLocalMenus();
          }
          $scope.isLoadingMenus = false;
        })
        .catch(function(err) {
          console.warn("GAS Connection error, using local data:", err);
          $scope.fallbackToLocalMenus();
          $scope.isLoadingMenus = false;
        });
    } else {
      $scope.fallbackToLocalMenus();
      $scope.isLoadingMenus = false;
    }
  };

  $scope.fallbackToLocalMenus = function() {
    const savedMenus = localStorage.getItem('kinyard_menus');
    if (savedMenus) {
      try {
        $scope.menus = JSON.parse(savedMenus);
      } catch (e) {
        $scope.menus = angular.copy(CONFIG.DEFAULT_MENUS);
      }
    } else {
      $scope.menus = angular.copy(CONFIG.DEFAULT_MENUS);
      localStorage.setItem('kinyard_menus', JSON.stringify($scope.menus));
    }
  };

  // 4. กรองหมวดหมู่และค้นหา
  $scope.setCategory = function(catId) {
    $scope.selectedCategory = catId;
  };

  $scope.filterMenu = function(item) {
    // กรองหมวดหมู่
    const matchCategory = ($scope.selectedCategory === 'all') || (item.category === $scope.selectedCategory);
    // กรองค้นหา
    const query = ($scope.searchQuery || '').trim().toLowerCase();
    const matchSearch = !query || 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query));

    return matchCategory && matchSearch;
  };

  // 5. เปิด Modal ปรับแต่งเมนู
  $scope.openCustomizeModal = function(menu) {
    if (!menu.is_available) {
      $scope.triggerToast('ขออภัย เมนูนี้หมดชั่วคราว');
      return;
    }

    $scope.selectedMenu = menu;
    $scope.itemQuantity = 1;
    $scope.itemNote = '';
    $scope.customOptions = {};

    // กำหนดตัวเลือกเริ่มต้น
    let optionsList = [];
    if (menu.options === "drink" || menu.category === "เครื่องดื่ม") {
      optionsList = CONFIG.DEFAULT_DRINK_OPTIONS;
    } else if (Array.isArray(menu.options) && menu.options.length > 0) {
      optionsList = menu.options;
    } else if (menu.category === "ก๋วยเตี๋ยวเรือ" || menu.category === "ต้มยำ/เย็นตาโฟ") {
      optionsList = CONFIG.DEFAULT_NOODLE_OPTIONS;
    }

    $scope.currentOptionsList = optionsList;

    // เลือกตัวเลือกแรกเป็น Default
    if (optionsList && optionsList.length > 0) {
      optionsList.forEach(function(group) {
        if (group.choices && group.choices.length > 0) {
          $scope.customOptions[group.name] = group.choices[0];
        }
      });
    }

    $scope.isCustomizeModalOpen = true;
  };

  $scope.closeCustomizeModal = function() {
    $scope.isCustomizeModalOpen = false;
    $scope.selectedMenu = null;
  };

  // 6. คำนวณราคาต่อหน่วยรวม Option
  $scope.calculateItemUnitPrice = function() {
    if (!$scope.selectedMenu) return 0;
    let unitPrice = $scope.selectedMenu.price;

    // ตรวจสอบราคาบวกเพิ่มในตัวเลือก เช่น (+15) หรือ (+10)
    angular.forEach($scope.customOptions, function(val) {
      if (typeof val === 'string') {
        const match = val.match(/\(\+(\d+)\)/);
        if (match && match[1]) {
          unitPrice += parseInt(match[1], 10);
        }
      }
    });

    return unitPrice;
  };

  $scope.increaseQty = function() {
    $scope.itemQuantity++;
  };

  $scope.decreaseQty = function() {
    if ($scope.itemQuantity > 1) {
      $scope.itemQuantity--;
    }
  };

  // 7. เพิ่มลงตะกร้า
  $scope.addToCart = function() {
    if (!$scope.selectedMenu) return;

    // รวมข้อความตัวเลือก
    const optionsArray = [];
    angular.forEach($scope.customOptions, function(choice, name) {
      if (choice && choice !== "ธรรมดา" && choice !== "ไม่ใส่") {
        optionsArray.push(choice);
      }
    });

    const optionsText = optionsArray.join(', ');
    const unitPrice = $scope.calculateItemUnitPrice();
    const subtotal = unitPrice * $scope.itemQuantity;

    const cartItem = {
      id: $scope.selectedMenu.id + '_' + Date.now(),
      menu_id: $scope.selectedMenu.id,
      name: $scope.selectedMenu.name,
      image: $scope.selectedMenu.image,
      unit_price: unitPrice,
      qty: $scope.itemQuantity,
      options: optionsText,
      note: $scope.itemNote,
      subtotal: subtotal
    };

    $scope.cart.push(cartItem);
    $scope.saveCartToStorage();
    $scope.closeCustomizeModal();

    if (typeof SoundService !== 'undefined') {
      SoundService.playSuccess();
    }

    $scope.triggerToast('เพิ่ม ' + cartItem.name + ' ลงตะกร้าแล้ว');
  };

  // 8. จัดการตะกร้าสินค้า
  $scope.openCartModal = function() {
    $scope.isCartModalOpen = true;
  };

  $scope.closeCartModal = function() {
    $scope.isCartModalOpen = false;
  };

  $scope.getCartCount = function() {
    return $scope.cart.reduce(function(total, item) {
      return total + item.qty;
    }, 0);
  };

  $scope.getCartTotal = function() {
    return $scope.cart.reduce(function(total, item) {
      return total + item.subtotal;
    }, 0);
  };

  $scope.increaseCartItemQty = function(item) {
    item.qty++;
    item.subtotal = item.unit_price * item.qty;
    $scope.saveCartToStorage();
  };

  $scope.decreaseCartItemQty = function(item, index) {
    if (item.qty > 1) {
      item.qty--;
      item.subtotal = item.unit_price * item.qty;
    } else {
      $scope.cart.splice(index, 1);
    }
    $scope.saveCartToStorage();
  };

  $scope.removeCartItem = function(index) {
    $scope.cart.splice(index, 1);
    $scope.saveCartToStorage();
  };

  $scope.saveCartToStorage = function() {
    localStorage.setItem('kinyard_cart', JSON.stringify($scope.cart));
  };

  $scope.loadCartFromStorage = function() {
    const saved = localStorage.getItem('kinyard_cart');
    if (saved) {
      try {
        $scope.cart = JSON.parse(saved);
      } catch (e) {
        $scope.cart = [];
      }
    }
  };

  // 9. ส่งออเดอร์ (Checkout)
  $scope.submitOrder = function() {
    if ($scope.cart.length === 0) {
      $scope.triggerToast('ตะกร้าสินค้าว่างเปล่า');
      return;
    }

    if (!$scope.selectedTable) {
      $scope.triggerToast('กรุณาระบุหมายเลขโต๊ะ');
      return;
    }

    $scope.isSubmittingOrder = true;

    // บันทึกชื่อและเบอร์โทร
    localStorage.setItem('kinyard_customer_name', $scope.customerName || '');
    localStorage.setItem('kinyard_customer_phone', $scope.customerPhone || '');

    const orderPayload = {
      action: 'createOrder',
      table_no: $scope.selectedTable,
      customer_name: $scope.customerName || 'ลูกค้าโต๊ะ ' + $scope.selectedTable,
      customer_phone: $scope.customerPhone || '',
      items: $scope.cart.map(function(item) {
        return {
          name: item.name,
          qty: item.qty,
          price: item.unit_price,
          options: item.options + (item.note ? ' (หมายเหตุ: ' + item.note + ')' : ''),
          subtotal: item.subtotal
        };
      }),
      total_price: $scope.getCartTotal(),
      note: $scope.orderNote || '',
      payment_status: 'Unpaid'
    };

    if ($scope.config.GAS_WEB_APP_URL && $scope.config.GAS_WEB_APP_URL.trim() !== "") {
      $http.post($scope.config.GAS_WEB_APP_URL, JSON.stringify(orderPayload), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      })
      .then(function(res) {
        if (res.data && res.data.success) {
          $scope.handleOrderSuccess(res.data.order_id, orderPayload);
        } else {
          $scope.handleMockOrderSuccess(orderPayload);
        }
      })
      .catch(function(err) {
        console.warn("GAS POST Error, falling back to local storage:", err);
        $scope.handleMockOrderSuccess(orderPayload);
      });
    } else {
      $scope.handleMockOrderSuccess(orderPayload);
    }
  };

  $scope.handleOrderSuccess = function(orderId, payload) {
    $scope.isSubmittingOrder = false;
    $scope.isCartModalOpen = false;

    const newOrder = {
      order_id: orderId,
      timestamp: new Date().toLocaleString('th-TH'),
      table_no: payload.table_no,
      customer_name: payload.customer_name,
      items: payload.items,
      total_price: payload.total_price,
      status: 'Pending',
      note: payload.note,
      payment_status: 'Unpaid'
    };

    $scope.activeOrder = newOrder;
    localStorage.setItem('kinyard_active_order', JSON.stringify(newOrder));

    // เคลียร์ตะกร้า
    $scope.cart = [];
    $scope.orderNote = '';
    $scope.saveCartToStorage();

    $scope.isTrackingView = true;
    if (typeof SoundService !== 'undefined') {
      SoundService.playSuccess();
    }
    $scope.triggerToast('ส่งออเดอร์เรียบร้อยแล้ว!');

    // เริ่มตรวจสอบสถานะแบบ Polling
    $scope.startStatusPolling(orderId);
  };

  $scope.handleMockOrderSuccess = function(payload) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const orderId = 'ORD-' + dateStr + '-' + randomSuffix;

    // บันทึกลง LocalStorage สำหรับจำลองเชื่อมต่อกับ Dashboard
    let mockOrders = [];
    try {
      mockOrders = JSON.parse(localStorage.getItem('kinyard_mock_orders') || '[]');
    } catch(e) {
      mockOrders = [];
    }

    const orderObj = {
      order_id: orderId,
      timestamp: new Date().toLocaleString('th-TH'),
      table_no: payload.table_no,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      items: payload.items,
      total_price: payload.total_price,
      status: 'Pending',
      note: payload.note,
      payment_status: 'Unpaid'
    };

    mockOrders.unshift(orderObj);
    localStorage.setItem('kinyard_mock_orders', JSON.stringify(mockOrders));

    $scope.handleOrderSuccess(orderId, payload);
  };

  // 10. ระบบติดตามสถานะออเดอร์
  $scope.startStatusPolling = function(orderId) {
    if (statusPollInterval) {
      $interval.cancel(statusPollInterval);
    }

    statusPollInterval = $interval(function() {
      $scope.checkOrderStatus(orderId);
    }, 6000);
  };

  $scope.checkOrderStatus = function(orderId) {
    if (!orderId) return;

    if ($scope.config.GAS_WEB_APP_URL && $scope.config.GAS_WEB_APP_URL.trim() !== "") {
      $http.get($scope.config.GAS_WEB_APP_URL + '?action=getOrderStatus&order_id=' + orderId)
        .then(function(res) {
          if (res.data && res.data.success && res.data.data) {
            $scope.activeOrder.status = res.data.data.status;
            $scope.activeOrder.payment_status = res.data.data.payment_status;
            localStorage.setItem('kinyard_active_order', JSON.stringify($scope.activeOrder));
          }
        });
    } else {
      // ตรวจสอบจาก LocalStorage
      try {
        const mockOrders = JSON.parse(localStorage.getItem('kinyard_mock_orders') || '[]');
        const found = mockOrders.find(function(o) { return o.order_id === orderId; });
        if (found) {
          $scope.activeOrder.status = found.status;
          $scope.activeOrder.payment_status = found.payment_status;
          localStorage.setItem('kinyard_active_order', JSON.stringify($scope.activeOrder));
        }
      } catch(e) {}
    }
  };

  $scope.orderMore = function() {
    $scope.isTrackingView = false;
  };

  $scope.viewOrderStatus = function() {
    $scope.isTrackingView = true;
  };

  // ตรวจสอบ Active Order ที่บันทึกไว้
  $scope.checkSavedActiveOrder = function() {
    const savedOrder = localStorage.getItem('kinyard_active_order');
    if (savedOrder) {
      try {
        $scope.activeOrder = JSON.parse(savedOrder);
        if ($scope.activeOrder && $scope.activeOrder.status !== 'Completed' && $scope.activeOrder.status !== 'Cancelled') {
          $scope.startStatusPolling($scope.activeOrder.order_id);
        }
      } catch (e) {}
    }
  };

  // Init App
  $scope.init = function() {
    $scope.loadMenus();
    $scope.loadCartFromStorage();
    $scope.checkSavedActiveOrder();
  };

  $scope.init();
}]);
