import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useProducts } from '../src/hooks/useProducts';
import { useToast } from '../src/context/ToastContext';
import { api } from '../src/api/client';
import { getProductImageSource } from '../src/constants/images';
import type { Product } from '../src/types/product';

const CATEGORY_ALL = 'All';

export default function HomeScreen() {
  const { products, loading, error, refetch } = useProducts();
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(products.map((p) => p.category));
    return [CATEGORY_ALL, ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === CATEGORY_ALL || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleBuy = useCallback(
    async (product: Product, quantity: number) => {
      if (product.stock <= 0) {
        showToast('This product is out of stock', 'error');
        return;
      }
      const qty = Math.max(1, Math.min(quantity, product.stock));
      setCheckingOutId(product._id);
      const { data, error: err } = await api.checkout(product._id, qty);
      setCheckingOutId(null);
      if (err) {
        showToast(err, 'error');
        refetch();
        return;
      }
      showToast(data?.message ?? 'Order placed successfully', 'success');
      refetch();
      setDetailProduct(null);
      setModalQuantity(1);
    },
    [showToast, refetch]
  );

  const setQuantityForModal = useCallback((product: Product, delta: number) => {
    setModalQuantity((prev) => {
      const next = prev + delta;
      return Math.max(1, Math.min(next, product.stock));
    });
  }, []);

  const openProductDetail = useCallback((product: Product) => {
    setDetailProduct(product);
    setModalQuantity(1);
  }, []);

  if (loading && products.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0369a1" />
        <Text style={styles.loadingText}>Loading products…</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load products</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
          accessibilityLabel="Raia-Connect logo"
        />
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Raia-Connect</Text>
          <Text style={styles.headerSubtitle}>Pharmaceutical products</Text>
        </View>
      </View>
      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or category…"
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.categorySection}>
        <Text style={styles.categoryLabel}>Category</Text>
        <FlatList
          data={categories}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.pill,
                  isActive && styles.pillActive,
                ]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive && styles.pillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      {filteredProducts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No products match your filters.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const imageSource = getProductImageSource(item.name);
            const isCheckingOut = checkingOutId === item._id;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => openProductDetail(item)}
                activeOpacity={0.7}
              >
                {imageSource != null ? (
                  <Image
                    source={imageSource}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Text style={styles.cardImagePlaceholderText}>?</Text>
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <Text style={styles.cardPrice}>
                    R$ {item.price.toFixed(2)}
                  </Text>
                  <Text style={styles.cardStock}>
                    Stock: {item.stock}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      (item.stock <= 0 || isCheckingOut) && styles.buyButtonDisabled,
                    ]}
                    disabled={item.stock <= 0 || isCheckingOut}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleBuy(item, 1);
                    }}
                  >
                    {isCheckingOut ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buyButtonText}>
                        {item.stock <= 0 ? 'Out of stock' : 'Buy'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal
        visible={detailProduct != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailProduct(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailProduct(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {detailProduct && (
              <>
                {getProductImageSource(detailProduct.name) != null ? (
                  <Image
                    source={getProductImageSource(detailProduct.name)!}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalImage, styles.cardImagePlaceholder]}>
                    <Text style={styles.cardImagePlaceholderText}>?</Text>
                  </View>
                )}
                <Text style={styles.modalTitle}>{detailProduct.name}</Text>
                <Text style={styles.modalCategory}>{detailProduct.category}</Text>
                <Text style={styles.modalPrice}>
                  R$ {detailProduct.price.toFixed(2)}
                </Text>
                <Text style={styles.modalStock}>
                  In stock: {detailProduct.stock}
                </Text>
                <View style={styles.quantityRow}>
                  <Text style={[styles.quantityLabel, { marginRight: 12 }]}>
                    Quantity:
                  </Text>
                  <View style={styles.quantityStepper}>
                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        (detailProduct.stock <= 0 || modalQuantity <= 1) &&
                          styles.quantityButtonDisabled,
                      ]}
                      disabled={
                        detailProduct.stock <= 0 || modalQuantity <= 1
                      }
                      onPress={() => setQuantityForModal(detailProduct, -1)}
                    >
                      <Text style={styles.quantityButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{modalQuantity}</Text>
                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        (detailProduct.stock <= 0 ||
                          modalQuantity >= detailProduct.stock) &&
                          styles.quantityButtonDisabled,
                      ]}
                      disabled={
                        detailProduct.stock <= 0 ||
                        modalQuantity >= detailProduct.stock
                      }
                      onPress={() => setQuantityForModal(detailProduct, 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.modalSubtotal}>
                  Subtotal: R$ {(detailProduct.price * modalQuantity).toFixed(2)}
                </Text>
                <View style={{display: 'flex', flexDirection: 'row', gap: 10, justifyContent: 'space-around', alignItems: 'center', width: '100%'}}>
                  <TouchableOpacity
                  style={[
                    styles.modalBuyButton,
                    (detailProduct.stock <= 0 || checkingOutId === detailProduct._id) &&
                      styles.buyButtonDisabled,
                  ]}
                  disabled={
                    detailProduct.stock <= 0 || checkingOutId === detailProduct._id
                  }
                  onPress={() => handleBuy(detailProduct, modalQuantity)}
                >
                  {checkingOutId === detailProduct._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buyButtonText}>
                      {detailProduct.stock <= 0 ? 'Out of stock' : 'Buy'}
                    </Text>
                  )}
                  </TouchableOpacity>
                  <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setDetailProduct(null);
                    setModalQuantity(1);
                  }}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Typed styles so components get correct ViewStyle/TextStyle/ImageStyle (fixes TS strict style errors). listContent uses grid for web. */
interface IndexStyles {
  container: ViewStyle;
  header: ViewStyle;
  headerLogo: ImageStyle;
  headerTextBlock: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  centered: ViewStyle;
  loadingText: TextStyle;
  errorTitle: TextStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  filterRow: ViewStyle;
  searchInput: TextStyle;
  categorySection: ViewStyle;
  categoryLabel: TextStyle;
  pills: ViewStyle;
  pillsContent: ViewStyle;
  pill: ViewStyle;
  pillActive: ViewStyle;
  pillText: TextStyle;
  pillTextActive: TextStyle;
  emptyText: TextStyle;
  listContent: ViewStyle & { display?: 'grid'; gridTemplateColumns?: string; gap?: number };
  card: ViewStyle;
  cardImage: ImageStyle;
  cardImagePlaceholder: ViewStyle;
  cardImagePlaceholderText: TextStyle;
  cardBody: ViewStyle;
  cardTitle: TextStyle;
  cardCategory: TextStyle;
  cardPrice: TextStyle;
  cardStock: TextStyle;
  buyButton: ViewStyle;
  buyButtonDisabled: ViewStyle;
  buyButtonText: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalImage: ImageStyle;
  modalTitle: TextStyle;
  modalCategory: TextStyle;
  modalPrice: TextStyle;
  modalStock: TextStyle;
  quantityRow: ViewStyle;
  quantityLabel: TextStyle;
  quantityStepper: ViewStyle;
  quantityButton: ViewStyle;
  quantityButtonDisabled: ViewStyle;
  quantityButtonText: TextStyle;
  quantityValue: TextStyle;
  modalSubtotal: TextStyle;
  modalBuyButton: ViewStyle;
  modalCloseButton: ViewStyle;
  modalCloseButtonText: TextStyle;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  headerLogo: {
    width: 48,
    height: 48,
    marginRight: 14,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0369a1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
  },
  categorySection: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  pills: {
    flexGrow: 0,
  },
  pillsContent: {
    paddingHorizontal: 20,
    paddingRight: 24,
    alignItems: 'center',
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    minHeight: 44,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
    shadowColor: '#0369a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 16,
  } as ViewStyle & { display: 'grid'; gridTemplateColumns: string; gap: number },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    flexDirection: 'column',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardImage: {
    width: "auto",
    height: 300,
    backgroundColor: '#f8fafc',
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 24,
    color: '#94a3b8',
  },
  cardBody: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  cardCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369a1',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  cardStock: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  buyButton: {
    backgroundColor: '#0369a1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  buyButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 18,
    paddingHorizontal: 20,
    letterSpacing: 0.2,
  },
  modalCategory: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0369a1',
    marginTop: 10,
    letterSpacing: 0.2,
  },
  modalStock: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    fontWeight: '500',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 22,
    color: '#0369a1',
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    minWidth: 32,
    textAlign: 'center',
  },
  modalSubtotal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 14,
    letterSpacing: 0.2,
  },
  modalBuyButton: {
    backgroundColor: '#0369a1',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 10,
    marginTop: 18,
  },
  modalCloseButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCloseButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
}) as IndexStyles;
