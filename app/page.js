'use client'

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import { firestore } from '@/firebase';
import { collection, getDocs, query, setDoc, deleteDoc, doc, where } from 'firebase/firestore';
import Layout from '../styles/layout'; // Adjust the import path as needed
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { Dialog } from '@mui/material';

const PriceUpdateDialog = ({ open, onClose, onConfirm, itemName, oldPrice, newPrice }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <Box sx={{ bgcolor: '#E6E6FA', p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Price Update Confirmation</Typography>
        <Typography>
        An item named &quot;{itemName}&quot; already exists with a price of ${oldPrice}.
        Do you want to update the price to ${newPrice}?
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
          <Button onClick={onConfirm} variant="contained" sx={{ bgcolor: '#9370DB' }}>Update Price</Button>
        </Box>
      </Box>
    </Dialog>
  );
};

const updateItemQuantity = async (id, quantity, updateInventoryCallback) => {
  const docRef = doc(firestore, 'inventory', id);
  if (quantity === 0) {
    await deleteDoc(docRef);
  } else {
    await setDoc(docRef, { quantity }, { merge: true });
  }
  await updateInventoryCallback();
};

const Home = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [priceDialog, setPriceDialog] = useState({ open: false, item: null });

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const itemsList = [];
    docs.forEach((doc) => {
      itemsList.push({ id: doc.id, ...doc.data() });
    });
    setInventory(itemsList);
    setFilteredItems(itemsList);

    const totalPrice = itemsList.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    setTotal(totalPrice);

    setSelectedItems(prev => {
      const newSelected = { ...prev };
      itemsList.forEach(item => {
        if (!(item.id in newSelected)) {
          newSelected[item.id] = true;
        }
      });
      return newSelected;
    });

    console.log('Updated inventory:', itemsList);
  };

  const addItem = async (newItem) => {
    if (newItem.name !== '' && newItem.price !== '') {
      const trimmedName = newItem.name.trim();
      const newPrice = parseFloat(newItem.price);
  
      // Check if item already exists
      const snapshot = await getDocs(query(collection(firestore, 'inventory'), where('name', '==', trimmedName)));
      
      if (!snapshot.empty) {
        // Item exists, update quantity and possibly price
        const existingItem = snapshot.docs[0];
        const existingData = existingItem.data();
        const newQuantity = existingData.quantity + 1;
        
        if (existingData.price !== newPrice) {
          // Price is different, open dialog
          setPriceDialog({
            open: true,
            item: {
              ref: existingItem.ref,
              name: trimmedName,
              oldPrice: existingData.price,
              newPrice: newPrice,
              newQuantity: newQuantity
            }
          });
        } else {
          // Price is the same, just update quantity
          await setDoc(existingItem.ref, { quantity: newQuantity }, { merge: true });
        }
      } else {
        // Item doesn't exist, add new item
        const docRef = doc(collection(firestore, 'inventory'));
        await setDoc(docRef, { name: trimmedName, price: newPrice, quantity: 1 });
      }
  
      setNewItem({ name: '', price: '' });  // This line uses the setNewItem state setter
      await updateInventory();
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleSearch = () => {
    const filtered = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredItems(filtered);
  };

  const handleItemSelect = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSelectAll = () => {
    setSelectedItems(prev => {
      const allSelected = filteredItems.every(item => prev[item.id]);
      if (allSelected) {
        return {};
      } else {
        const newSelected = {};
        filteredItems.forEach(item => {
          newSelected[item.id] = true;
        });
        return newSelected;
      }
    });
  };

  const isAllSelected = filteredItems.length > 0 && filteredItems.every(item => selectedItems[item.id]);
  const isSomeSelected = filteredItems.some(item => selectedItems[item.id]);

  const handlePriceUpdateConfirm = async () => {
    const { ref, newPrice, newQuantity } = priceDialog.item;
    await setDoc(ref, { price: newPrice, quantity: newQuantity }, { merge: true });
    setPriceDialog({ open: false, item: null });
    await updateInventory();
  };
  
  const handlePriceUpdateCancel = async () => {
    const { ref, newQuantity } = priceDialog.item;
    await setDoc(ref, { quantity: newQuantity }, { merge: true });
    setPriceDialog({ open: false, item: null });
    await updateInventory();
  };

  const calculateSelectedTotal = () => {
    if (!isSomeSelected) return 0;
    return filteredItems.reduce((sum, item) => {
      if (selectedItems[item.id]) {
        return sum + parseFloat(item.price) * item.quantity;
      }
      return sum;
    }, 0);
  };

  // Define the animation
  const bounceAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  `;

  return (
    <Layout>
      <Image
        src="/pantry.jpg"
        alt="Chandni Patel"
        fill
        style={{ objectFit: 'cover', zIndex: -1 }}
        quality={100}
      />
      
      <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
       padding: 4, minHeight: '100vh' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" sx={{ mb: 4, color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold' }}>Inventory Tracker</Typography>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Box sx={{ width: '100%', maxWidth: 600, bgcolor: 'background.paper', p: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 2, boxShadow: 3 }}>
            <Box component="form" onSubmit={(e) => {
              e.preventDefault();
              addItem(newItem);
            }} sx={{ display: 'flex', mb: 2 }}>
              <TextField
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                label="Enter Item"
                fullWidth
                variant="outlined"
                sx={{ mr: 2 }}
              />
              <TextField
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                label="Enter Price"
                type="number"
                fullWidth
                variant="outlined"
                sx={{ mr: 2 }}
              />
              <Button 
                type="submit"
                variant="contained" 
                onClick={handleSearch}
                sx={{
                  backgroundColor: '#fb8a80', // Change background color
                  color: '#fff', // Change text color
                  '&:hover': {
                    backgroundColor: '#c6c4ff', // Optional: Change hover background color
                  }
                }}
              >
              +
              </Button>
            </Box>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                label="Search"
                fullWidth
                variant="outlined"
                sx={{ mr: 2 }}
              />
              <Button 
                variant="contained" 
                onClick={handleSearch}
                sx={{
                  backgroundColor: '#fb8a80', // Change background color
                  color: '#fff', // Change text color
                  '&:hover': {
                    backgroundColor: '#c6c4ff', // Optional: Change hover background color
                  }
                }}
              >
              Search
              </Button>
            </Box>

            <Box sx={{                            //New scrollable Box for the list
              maxHeight: '350px',
              overflowY: 'auto',
              my: 2,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              },
            }}>
              <List>
                <AnimatePresence>
                  {filteredItems.map((item, id) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ListItem key={id} sx={{ mb: 1, bgcolor: 'background.default', borderRadius: 1, boxShadow: 1 }}>
                        <Checkbox
                          checked={!!selectedItems[item.id]}
                          onChange={() => handleItemSelect(item.id)}
                          size="small"
                          sx={{
                            '& .MuiSvgIcon-root': { fontSize: 20 },
                            color: '#E6E6FA',
                            '&.Mui-checked': {
                              color: '#9370DB',
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(147, 112, 219, 0.04)', // Light purple background on hover
                            },
                            color: '#b799cd', // This sets the color of the border when unchecked
                            '&.Mui-checked': {
                              color: '#9370DB', // This sets the color when checked
                            },
                            '&.Mui-indeterminate': {
                              color: '#9370DB', // This sets the color when indeterminate
                            },
                          }}
                        />
                        <ListItemText primary={item.name} secondary={`$${item.price} x ${item.quantity}`} />
                        <Box>
                          <IconButton onClick={() => updateItemQuantity(item.id, item.quantity + 1, updateInventory)}>
                            <AddIcon />
                          </IconButton>
                          <IconButton onClick={() => updateItemQuantity(item.id, item.quantity - 1, updateInventory)}>
                            <RemoveIcon />
                          </IconButton>
                          <IconButton edge="end" aria-label="delete" onClick={() => updateItemQuantity(item.id, 0, updateInventory)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </List>
            </Box>

            {filteredItems.length > 0 && (          // Total display
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, marginRight: 4, marginLeft: 2, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected && !isAllSelected}
                    onChange={handleSelectAll}
                      size="small"
                      sx={{
                        '& .MuiSvgIcon-root': { fontSize: 20 },
                        color: '#E6E6FA',
                        '&.Mui-checked': {
                          color: '#9370DB',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(147, 112, 219, 0.04)', // Light purple background on hover
                        },
                        color: '#4B0082', // This sets the color of the border when unchecked
                        '&.Mui-checked': {
                          color: '#9370DB', // This sets the color when checked
                        },
                        '&.Mui-indeterminate': {
                          color: '#9370DB', // This sets the color when indeterminate
                        },
                      }}
                    />
                  }
                  label="Select All"
                  sx={{ marginRight: 'auto' }} // This pushes the label to the left
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ mr: 1 }}>Total: </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      backgroundColor: '#C3B1E1',
                      color: '#4B0082', // Indigo color for text, for better contrast 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        animation: `${bounceAnimation} 0.5s ease infinite`,
                        boxShadow: '0 4px 8px rgba(75, 0, 130, 0.2)',
                        backgroundColor: '#D8BFD8', // Slightly darker lavender on hover
                      }
                    }}
                  >
                    ${calculateSelectedTotal().toFixed(2)}
                  </Typography>
                </Box> 
              </Box>
            )}
          </Box>
        </motion.div>
      </Container>
      
      <PriceUpdateDialog
        open={priceDialog.open}
        onClose={handlePriceUpdateCancel}
        onConfirm={handlePriceUpdateConfirm}
        itemName={priceDialog.item?.name}
        oldPrice={priceDialog.item?.oldPrice}
        newPrice={priceDialog.item?.newPrice}
      />

    </Layout>
  );
};

export default Home;